import express, { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_PETITIONS, INITIAL_WARDS, INITIAL_HELPLINES, INITIAL_ANNOUNCEMENTS } from "./src/data/mockData";
import { getIssueCategoryLabel, ISSUE_CATEGORIES, Petition, Comment, IssueCategory, PetitionStatus } from "./src/types";

dotenv.config({ path: ".env.local" });
dotenv.config();

const ADMIN_SESSION_COOKIE = "vilangaadu_admin_session";
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const safeEqual = (value: string, expected: string): boolean => {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
};

const signAdminSession = (username: string, secret: string): string => {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

const verifyAdminSession = (token: string | undefined, secret: string, username: string): boolean => {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username?: string;
      expiresAt?: number;
    };
    return data.username === username && typeof data.expiresAt === "number" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
};

const getCookie = (request: Request, name: string): string | undefined =>
  request.headers.cookie
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

const isIssueCategory = (value: unknown): value is IssueCategory =>
  ISSUE_CATEGORIES.some(item => item.value === value);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(express.json({ limit: "5mb" }));

  // In-memory persistent data state
  let petitions: Petition[] = [...INITIAL_PETITIONS];
  let wards = [...INITIAL_WARDS];
  const dataDirectory = path.join(process.cwd(), "data");
  const stateFile = path.join(dataDirectory, "app-state.json");
  const temporaryStateFile = `${stateFile}.tmp`;

  const saveAppState = async () => {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(temporaryStateFile, JSON.stringify({ petitions, wards }, null, 2), "utf8");
    await fs.rename(temporaryStateFile, stateFile);
  };

  try {
    const savedState = JSON.parse(await fs.readFile(stateFile, "utf8")) as {
      petitions?: Petition[];
      wards?: typeof wards;
    };
    if (!Array.isArray(savedState.petitions) || !Array.isArray(savedState.wards)) {
      throw new Error("Admin data file has an invalid format");
    }
    petitions = savedState.petitions;
    wards = savedState.wards;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await saveAppState();
  }

  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const username = process.env.ADMIN_USERNAME;
    const secret = process.env.ADMIN_SESSION_SECRET;
    const isAuthenticated = username && secret &&
      verifyAdminSession(getCookie(req, ADMIN_SESSION_COOKIE), secret, username);
    if (!isAuthenticated) {
      res.status(401).json({ error: "நிர்வாக உள்நுழைவு தேவை" });
      return;
    }
    next();
  };

  // Gemini API initialization
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // GET Petitions with filtering
  app.get("/api/petitions", (req, res) => {
    try {
      const { search, ward, category, status } = req.query;
      let filtered = [...petitions];

      if (search && typeof search === "string") {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(p =>
          p.trackingNo.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.streetName.toLowerCase().includes(q) ||
          p.citizenName.toLowerCase().includes(q)
        );
      }

      if (ward && ward !== "all") {
        const wardNum = parseInt(ward as string, 10);
        if (!isNaN(wardNum)) {
          filtered = filtered.filter(p => p.wardNo === wardNum);
        }
      }

      if (category && category !== "all") {
        filtered = filtered.filter(p => p.category === category);
      }

      if (status && status !== "all") {
        filtered = filtered.filter(p => p.status === status);
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(filtered);
    } catch (err) {
      console.error("Error fetching petitions:", err);
      res.status(500).json({ error: "Failed to fetch petitions" });
    }
  });

  // GET Single Petition
  app.get("/api/petitions/:id", (req, res) => {
    const p = petitions.find(item => item.id === req.params.id || item.trackingNo === req.params.id);
    if (!p) {
      return res.status(404).json({ error: "மனு கிடைக்கவில்லை (Petition not found)" });
    }
    res.json(p);
  });

  // POST Create New Petition
  app.post("/api/petitions", async (req, res) => {
    try {
      const { title, description, category, wardNo, streetName, citizenName, phone, formalDraft, imageUrl } = req.body;

      if (!title || !description || !wardNo || !citizenName || !phone) {
        return res.status(400).json({ error: "அனைத்து விவரங்களையும் பூர்த்தி செய்யவும்" });
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const trackingNo = `MS-ACH-2026-${randomSuffix}`;

      const newPetition: Petition = {
        id: `pet-${Date.now()}`,
        trackingNo,
        title: title.trim(),
        description: description.trim(),
        formalDraft: formalDraft || undefined,
        category: category || "others",
        wardNo: Number(wardNo),
        streetName: streetName ? streetName.trim() : `வார்டு ${wardNo}`,
        citizenName: citizenName.trim(),
        phone: phone.trim(),
        status: "pending",
        upvotes: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
        imageUrl: imageUrl || undefined
      };

      petitions.unshift(newPetition);

      // Update ward total count
      const wardIndex = wards.findIndex(w => w.wardNo === Number(wardNo));
      if (wardIndex !== -1) {
        wards[wardIndex].totalIssues += 1;
      }

      await saveAppState();
      res.status(201).json(newPetition);
    } catch (err) {
      console.error("Error creating petition:", err);
      res.status(500).json({ error: "மனு சமர்ப்பிப்பதில் பிழை ஏற்பட்டது" });
    }
  });

  app.post("/api/admin/petitions", requireAdmin, async (req, res) => {
    const {
      title,
      description,
      category,
      wardNo,
      streetName,
      citizenName,
      phone,
      status,
      officialNote
    } = req.body ?? {};
    const numericWardNo = Number(wardNo);
    const allowedStatuses: PetitionStatus[] = ["pending", "in_progress", "action_taken", "resolved"];
    const ward = wards.find(item => item.wardNo === numericWardNo);
    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";

    if (
      typeof title !== "string" || !title.trim() || title.length > 200 ||
      typeof description !== "string" || !description.trim() || description.length > 5000 ||
      !isIssueCategory(category) ||
      !Number.isInteger(numericWardNo) || !ward ||
      typeof streetName !== "string" || !streetName.trim() || streetName.length > 200 ||
      typeof citizenName !== "string" || !citizenName.trim() || citizenName.length > 120 ||
      typeof phone !== "string" || phoneDigits.length < 10 || phoneDigits.length > 15 ||
      (status !== undefined && !allowedStatuses.includes(status)) ||
      (officialNote !== undefined && (typeof officialNote !== "string" || officialNote.length > 2000))
    ) {
      return res.status(400).json({ error: "மனு விவரங்களைச் சரிபார்க்கவும்" });
    }

    let trackingNo = "";
    for (let attempt = 0; attempt < 9000; attempt += 1) {
      const candidate = `MS-ACH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!petitions.some(item => item.trackingNo === candidate)) {
        trackingNo = candidate;
        break;
      }
    }
    if (!trackingNo) return res.status(409).json({ error: "மனு எண் உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." });

    const now = new Date().toISOString();
    const newPetition: Petition = {
      id: `pet-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      trackingNo,
      title: title.trim(),
      description: description.trim(),
      category,
      wardNo: numericWardNo,
      streetName: streetName.trim(),
      citizenName: citizenName.trim(),
      phone: phone.trim(),
      status: status ?? "pending",
      upvotes: 0,
      createdAt: now,
      updatedAt: now,
      comments: [],
      officialNote: typeof officialNote === "string" ? officialNote.trim() || undefined : undefined
    };

    petitions.unshift(newPetition);
    ward.totalIssues += 1;
    if (newPetition.status === "resolved") ward.resolvedIssues += 1;

    try {
      await saveAppState();
      res.status(201).json(newPetition);
    } catch (err) {
      const createdIndex = petitions.findIndex(item => item.id === newPetition.id);
      if (createdIndex >= 0) petitions.splice(createdIndex, 1);
      ward.totalIssues -= 1;
      if (newPetition.status === "resolved") ward.resolvedIssues -= 1;
      console.error("Error creating admin petition:", err);
      res.status(500).json({ error: "மனுவைச் சேர்க்க முடியவில்லை" });
    }
  });

  // POST Upvote Petition
  app.post("/api/petitions/:id/upvote", async (req, res) => {
    const p = petitions.find(item => item.id === req.params.id);
    if (!p) {
      return res.status(404).json({ error: "Petition not found" });
    }

    p.upvotes += 1;
    try {
      await saveAppState();
    } catch (err) {
      console.error("Error saving petition upvote:", err);
      return res.status(500).json({ error: "ஆதரவைச் சேமிக்க முடியவில்லை" });
    }
    res.json({ id: p.id, upvotes: p.upvotes });
  });

  // POST Add Comment
  app.post("/api/petitions/:id/comment", async (req, res) => {
    const p = petitions.find(item => item.id === req.params.id);
    if (!p) {
      return res.status(404).json({ error: "Petition not found" });
    }

    const { author, text, role } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "கருத்து காலியாக உள்ளது" });
    }

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: author || "பொதுமக்கள்",
      role: role || "citizen",
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    p.comments.push(newComment);
    p.updatedAt = new Date().toISOString();

    try {
      await saveAppState();
    } catch (err) {
      console.error("Error saving petition comment:", err);
      return res.status(500).json({ error: "கருத்தைச் சேமிக்க முடியவில்லை" });
    }
    res.json(p);
  });

  // GET Stats
  app.get("/api/stats", (req, res) => {
    const total = petitions.length;
    const resolved = petitions.filter(p => p.status === "resolved").length;
    const inProgress = petitions.filter(p => p.status === "in_progress" || p.status === "action_taken").length;
    const pending = petitions.filter(p => p.status === "pending").length;
    const totalUpvotes = petitions.reduce((acc, curr) => acc + curr.upvotes, 0) + 380; // offset for community total

    res.json({
      total,
      resolved,
      inProgress,
      pending,
      totalUpvotes,
      totalCitizensServed: 1250 + total * 4
    });
  });

  // GET Wards
  app.get("/api/wards", (req, res) => {
    res.json(wards);
  });

  app.post("/api/admin/login", (req, res) => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!username || !password || !secret) {
      return res.status(503).json({ error: "நிர்வாக உள்நுழைவு அமைக்கப்படவில்லை. சேவையக அமைப்புகளைச் சரிபார்க்கவும்." });
    }

    const clientKey = req.ip;
    const now = Date.now();
    const attempts = loginAttempts.get(clientKey);
    if (attempts && attempts.resetAt > now && attempts.count >= 5) {
      return res.status(429).json({ error: "பல முறை முயற்சிக்கப்பட்டது. 15 நிமிடங்களுக்குப் பிறகு முயற்சிக்கவும்." });
    }
    if (attempts && attempts.resetAt <= now) loginAttempts.delete(clientKey);

    const suppliedUsername = typeof req.body?.username === "string" ? req.body.username : "";
    const suppliedPassword = typeof req.body?.password === "string" ? req.body.password : "";
    if (!safeEqual(suppliedUsername, username) || !safeEqual(suppliedPassword, password)) {
      const current = loginAttempts.get(clientKey);
      loginAttempts.set(clientKey, {
        count: (current?.count ?? 0) + 1,
        resetAt: current?.resetAt && current.resetAt > now ? current.resetAt : now + 15 * 60 * 1000
      });
      return res.status(401).json({ error: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது" });
    }

    loginAttempts.delete(clientKey);
    res.cookie(ADMIN_SESSION_COOKIE, signAdminSession(username, secret), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/admin",
      maxAge: ADMIN_SESSION_DURATION_MS
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({ username });
  });

  app.get("/api/admin/session", requireAdmin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ authenticated: true, username: process.env.ADMIN_USERNAME });
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/admin"
    });
    res.json({ success: true });
  });

  app.put("/api/admin/wards/:wardNo", requireAdmin, async (req, res) => {
    const wardNo = Number(req.params.wardNo);
    const ward = wards.find(item => item.wardNo === wardNo);
    const { name, keyStreets } = req.body ?? {};
    if (!ward) return res.status(404).json({ error: "வார்டு கிடைக்கவில்லை" });
    if (typeof name !== "string" || !name.trim() || name.length > 120 || !Array.isArray(keyStreets)) {
      return res.status(400).json({ error: "வார்டு பெயர் மற்றும் வீதிப் பட்டியலைச் சரிபார்க்கவும்" });
    }

    const cleanedStreets = keyStreets
      .filter((street: unknown): street is string => typeof street === "string")
      .map((street: string) => street.trim())
      .filter((street: string) => street.length > 0 && street.length <= 120);
    if (cleanedStreets.length !== keyStreets.length || cleanedStreets.length > 100) {
      return res.status(400).json({ error: "வீதிப் பெயர்கள் காலியாக இருக்கக்கூடாது; அதிகபட்சம் 100 வீதிகள் சேர்க்கலாம்" });
    }

    ward.name = name.trim();
    ward.keyStreets = [...new Set(cleanedStreets)];
    try {
      await saveAppState();
      res.json(ward);
    } catch (err) {
      console.error("Error saving ward changes:", err);
      res.status(500).json({ error: "வார்டு மாற்றங்களைச் சேமிக்க முடியவில்லை" });
    }
  });

  app.patch("/api/admin/petitions/:id", requireAdmin, async (req, res) => {
    const petition = petitions.find(item => item.id === req.params.id);
    if (!petition) return res.status(404).json({ error: "மனு கிடைக்கவில்லை" });
    const { title, description, category, wardNo, streetName, citizenName, phone, status, officialNote } = req.body ?? {};
    const allowedStatuses: PetitionStatus[] = ["pending", "in_progress", "action_taken", "resolved"];
    const numericWardNo = wardNo === undefined ? petition.wardNo : Number(wardNo);
    const nextWard = wards.find(item => item.wardNo === numericWardNo);
    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (
      (title !== undefined && (typeof title !== "string" || !title.trim() || title.length > 200)) ||
      (description !== undefined && (typeof description !== "string" || !description.trim() || description.length > 5000)) ||
      (category !== undefined && !isIssueCategory(category)) ||
      (wardNo !== undefined && (!Number.isInteger(numericWardNo) || !nextWard)) ||
      (streetName !== undefined && (typeof streetName !== "string" || !streetName.trim() || streetName.length > 200)) ||
      (citizenName !== undefined && (typeof citizenName !== "string" || !citizenName.trim() || citizenName.length > 120)) ||
      (phone !== undefined && (typeof phone !== "string" || phoneDigits.length < 10 || phoneDigits.length > 15)) ||
      (status !== undefined && !allowedStatuses.includes(status)) ||
      (officialNote !== undefined && (typeof officialNote !== "string" || officialNote.length > 2000))
    ) {
      return res.status(400).json({ error: "மனு விவரங்களைச் சரிபார்க்கவும்" });
    }

    const previousPetition = { ...petition };
    const previousWard = wards.find(item => item.wardNo === petition.wardNo);
    const previousWasResolved = petition.status === "resolved";
    const nextStatus = status ?? petition.status;
    if (wardNo !== undefined && numericWardNo !== petition.wardNo) {
      if (previousWard) previousWard.totalIssues = Math.max(0, previousWard.totalIssues - 1);
      if (previousWasResolved && previousWard) previousWard.resolvedIssues = Math.max(0, previousWard.resolvedIssues - 1);
      nextWard!.totalIssues += 1;
      if (nextStatus === "resolved") nextWard!.resolvedIssues += 1;
    } else if (previousWasResolved !== (nextStatus === "resolved") && nextWard) {
      nextWard.resolvedIssues = Math.max(0, nextWard.resolvedIssues + (nextStatus === "resolved" ? 1 : -1));
    }
    if (title !== undefined) petition.title = title.trim();
    if (description !== undefined) petition.description = description.trim();
    if (category !== undefined) petition.category = category;
    if (wardNo !== undefined) petition.wardNo = numericWardNo;
    if (streetName !== undefined) petition.streetName = streetName.trim();
    if (citizenName !== undefined) petition.citizenName = citizenName.trim();
    if (phone !== undefined) petition.phone = phone.trim();
    petition.status = nextStatus;
    if (officialNote !== undefined) petition.officialNote = officialNote.trim() || undefined;
    petition.updatedAt = new Date().toISOString();
    try {
      await saveAppState();
      res.json(petition);
    } catch (err) {
      Object.assign(petition, previousPetition);
      if (wardNo !== undefined && numericWardNo !== previousPetition.wardNo) {
        if (previousWard) previousWard.totalIssues += 1;
        if (previousWasResolved && previousWard) previousWard.resolvedIssues += 1;
        if (nextWard) nextWard.totalIssues = Math.max(0, nextWard.totalIssues - 1);
        if (nextStatus === "resolved" && nextWard) nextWard.resolvedIssues = Math.max(0, nextWard.resolvedIssues - 1);
      } else if (previousWasResolved !== (nextStatus === "resolved") && nextWard) {
        nextWard.resolvedIssues = Math.max(0, nextWard.resolvedIssues + (previousWasResolved ? 1 : -1));
      }
      console.error("Error saving petition changes:", err);
      res.status(500).json({ error: "மனு மாற்றங்களைச் சேமிக்க முடியவில்லை" });
    }
  });

  app.delete("/api/admin/petitions/:id", requireAdmin, async (req, res) => {
    const petitionIndex = petitions.findIndex(item => item.id === req.params.id);
    if (petitionIndex < 0) return res.status(404).json({ error: "மனு கிடைக்கவில்லை" });
    const [deletedPetition] = petitions.splice(petitionIndex, 1);
    const ward = wards.find(item => item.wardNo === deletedPetition.wardNo);
    if (ward) {
      ward.totalIssues = Math.max(0, ward.totalIssues - 1);
      if (deletedPetition.status === "resolved") ward.resolvedIssues = Math.max(0, ward.resolvedIssues - 1);
    }
    try {
      await saveAppState();
      res.json({ success: true });
    } catch (err) {
      petitions.splice(petitionIndex, 0, deletedPetition);
      if (ward) {
        ward.totalIssues += 1;
        if (deletedPetition.status === "resolved") ward.resolvedIssues += 1;
      }
      console.error("Error deleting petition:", err);
      res.status(500).json({ error: "மனுவை நீக்க முடியவில்லை" });
    }
  });

  // GET Helplines
  app.get("/api/helplines", (req, res) => {
    res.json(INITIAL_HELPLINES);
  });

  // GET Announcements
  app.get("/api/announcements", (req, res) => {
    res.json(INITIAL_ANNOUNCEMENTS);
  });

  // POST Generate AI Petition Draft using Gemini API (@google/genai)
  app.post("/api/generate-draft", async (req, res) => {
    try {
      const { userPrompt, wardNo, category, citizenName, streetName } = req.body;

      if (!userPrompt || !userPrompt.trim()) {
        return res.status(400).json({ error: "தயவுசெய்து உங்கள் புகாரை தட்டச்சு செய்யுங்கள்" });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback draft generator if key not present yet
        const fallbackDraft = `அனுப்புநர்:
${citizenName || 'பொதுமக்கள்'},
${streetName || 'அச்சரப்பாக்கம்'}, வார்டு ${wardNo || '1-15'},
அச்சரப்பாக்கம் பேரூராட்சி, செங்கல்பட்டு மாவட்டம்.

பெறுநர்:
உயர்திரு. செயல் அலுவலர் அவர்கள்,
பேரூராட்சி அலுவலகம்,
அச்சரப்பாக்கம்.

பொருள்: ${userPrompt.slice(0, 50)}... தொடர்பான மனு.

ஐயா/அம்மா,

வணக்கம். அச்சரப்பாக்கம் பேரூராட்சி வார்டு ${wardNo || ''}ல் வசித்து வரும் பொதுமக்கள் சார்பாக இந்த மனுவினைச் சமர்ப்பிக்கிறோம்.

பிரச்சனை விவரம்:
${userPrompt}

மேற்கண்ட பிரச்சனையை உடனடியாக நேரில் வந்து ஆய்வு செய்து, தகுந்த நடவடிக்கை எடுத்து பொதுமக்களின் சிரமத்தைப் போக்குமாறு மிகவும் தாழ்மையுடன் கேட்டுக்கொள்கிறோம்.

நன்றி!

இப்படிக்கு,
${citizenName || 'வார்டு பொதுமக்கள்'}`;

        return res.json({ draft: fallbackDraft, isFallback: true });
      }

      const prompt = `You are an expert Tamil legal and administrative petition writer for Government of Tamil Nadu Town Panchayats.
Translate and format the following casual complaint into an official, formal, highly structured Tamil Government Petition (அரசு அதிகாரப்பூர்வ மனு மாதிரி).

Context:
- Location: Acharapakkam Town Panchayat (அச்சரப்பாக்கம் பேரூராட்சி), Chengalpattu District.
- Recipient: உயர்திரு. செயல் அலுவலர் அவர்கள் (Executive Officer), அச்சரப்பாக்கம் பேரூராட்சி / சம்பந்தப்பட்ட துறை அதிகாரி.
- Citizen Complaint/Notes: "${userPrompt}"
- Ward No: ${wardNo || '1-15'}
- Street: ${streetName || ''}
- Citizen Name: ${citizenName || 'மனுதாரர்'}
- Category: ${category ? getIssueCategoryLabel(category) : 'பொதுப் பிரச்சனை'}

Requirements:
1. Start with proper header format:
"அனுப்புநர்:"
"பெறுநர்:" (உயர்திரு. செயல் அலுவலர் அவர்கள், அச்சரப்பாக்கம் பேரூராட்சி அலுவலகம், அச்சரப்பாக்கம்.)
2. Include a clear, formal Subject line: "பொருள்: ..."
3. Start body with respectful salutation: "ஐயா/அம்மா, வணக்கம்."
4. Expand the complaint clearly with formal Tamil words, highlighting public hardship and urgency.
5. Respectful closing: "எனவே, தாங்கள் உடனடியாக நேரில் ஆய்வு செய்து...", "நன்றி", "இப்படிக்கு,".
6. Output ONLY the formatted Tamil petition text cleanly without markdown backticks or commentary.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });

      const draftText = response.text ? response.text.trim() : "";
      res.json({ draft: draftText });
    } catch (err: any) {
      console.error("Gemini draft generation error:", err);
      res.status(500).json({ error: "AI மனு உருவாக்குவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்." });
    }
  });

  // Vite middleware for dev or Static file serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
