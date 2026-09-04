// Per CLAUDE.md Hard NOs: no landing page — the dashboard IS the landing page.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/disputes");
}
