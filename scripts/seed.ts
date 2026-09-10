/**
 * Loads the sample calls into a running app.
 *   npm run seed                                   # pre-analyzed run r1 → http://localhost:3100
 *   npm run seed -- --run=r2 --url=https://….vercel.app
 *       (production: needs ADMIN_TOKEN in .env.local, matching the deployment. Audio is uploaded through the
 *        app's /api/blob-upload route straight to private Blob storage, because Vercel limits request bodies to 4.5 MB)
 *   npm run seed -- --live                         # upload raw recordings and let the app process them
 */
import fs from "node:fs";
import path from "node:path";
import { uploadPresigned } from "@vercel/blob/client";
import { CACHE, RECORDINGS, callIdFromFile, readJson, recordings } from "./lib";

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const base = (flag("url") ?? "http://localhost:3100").replace(/\/$/, "");
const run = flag("run") ?? "r1";
const live = args.includes("--live");
const remote = !/localhost|127\.0\.0\.1/.test(base);
const headers: Record<string, string> = process.env.ADMIN_TOKEN ? { "x-admin-token": process.env.ADMIN_TOKEN } : {};

if (remote && !live && !process.env.ADMIN_TOKEN) {
