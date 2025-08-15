import React, { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import RakView from "./components/RakView";
import DocumentList from "./components/DocumentList";

type Page = "login" | "dashboard" | "bidang" | "raks" | "documents";

export default function App() {
    // pakai origin saat ini kalau VITE_API_BASE tidak diset
    const BASE =
        (import.meta as any)?.env?.VITE_API_BASE || window.location.origin;

    const [page, setPage] = useState<Page>("login");
    const [user, setUser] = useState<any | null>(null);
    const [checking, setChecking] = useState(true);
    const [activeBidang, setActiveBidang] = useState<any | null>(null);
    const [activeRak, setActiveRak] = useState<any | null>(null);

    // normalisasi role dari server
    const normalizeRole = (u: any) =>
        (u?.role?.name || u?.role?.nama || u?.role || "")
            .toString()
            .toLowerCase();

    // --- CSRF helpers (penting untuk fetch) ---
    function getXsrfTokenFromCookie() {
        const m = document.cookie
            .split("; ")
            .find((r) => r.startsWith("XSRF-TOKEN="));
        return m ? decodeURIComponent(m.split("=")[1]) : "";
    }
    async function fetchWithXsrf(url: string, init: RequestInit = {}) {
        const xsrf = getXsrfTokenFromCookie();
        const headers = new Headers(init.headers || {});
        headers.set("Accept", "application/json"); // ✅
        headers.set("Content-Type", "application/json");
        if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
        return fetch(url, { credentials: "include", ...init, headers });
    }

    // helper aman JSON
    async function getJSON(url: string, init: RequestInit = {}) {
        const headers = new Headers(init.headers || {});
        headers.set("Accept", "application/json"); // ✅ penting
        const res = await fetch(url, {
            credentials: "include",
            ...init,
            headers,
        });
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
            const text = await res.text();
            throw new Error(
                `HTTP ${res.status} ${url}: ${text.slice(0, 120)}…`
            );
        }
        if (!ct.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Non-JSON from ${url}: ${text.slice(0, 120)}…`);
        }
        return res.json();
    }

    const fetchMe = () => getJSON(`${BASE}/api/user`);

    // arahkan halaman berdasarkan role
    function routeByRole(role: string) {
        setPage(role === "admin" ? "dashboard" : "bidang");
    }

    // cek sesi saat load
    useEffect(() => {
        (async () => {
            try {
                const me = await fetchMe();
                setUser(me);
                routeByRole(normalizeRole(me));
            } catch {
                setPage("login");
            } finally {
                setChecking(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // dipanggil dari LoginPage
    async function handleLogin(email: string, password: string) {
        // 1) ambil CSRF cookie
        await fetch(`${BASE}/sanctum/csrf-cookie`, { credentials: "include" });

        // 2) login (HARUS kirim X-XSRF-TOKEN di header)
        const res = await fetchWithXsrf(`${BASE}/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.message || "Login gagal");
        }

        // 3) ambil profil & arahkan
        const me = await fetchMe();
        if (!me) throw new Error("Gagal mengambil profil");
        setUser(me);
        routeByRole(normalizeRole(me));
    }

    async function handleLogout() {
        await fetchWithXsrf(`${BASE}/logout`, { method: "POST" });
        setUser(null);
        setPage("login");
    }

    if (checking) return <div className="p-6">Memeriksa sesi…</div>;

    if (page === "dashboard" && user) {
        return (
            <Dashboard
                role="admin"
                username={user.name || user.email}
                onLogout={handleLogout}
                onSelectBidang={(b) => console.log("selected bidang:", b)}
            />
        );
    }

    if (page === "bidang" && user) {
        return (
            <Dashboard
                role="pegawai"
                username={user.name || user.email}
                onLogout={handleLogout}
                onSelectBidang={(b) => {
                    setActiveBidang(b);
                    setPage("raks");
                }}
            />
        );
    }

    if (page === "raks" && user && activeBidang) {
        return (
            <RakView
                bidang={activeBidang}
                onBack={() => setPage("bidang")}
                onOpenRak={(rak) => {
                    setActiveRak(rak);
                    setPage("documents");
                }}
            />
        );
    }

    if (page === "documents" && user && activeBidang && activeRak) {
        return (
            <DocumentList
                bidang={activeBidang}
                rak={activeRak}
                onBack={() => setPage("raks")}
            />
        );
    }

    return <LoginPage onLogin={handleLogin} />;
}
