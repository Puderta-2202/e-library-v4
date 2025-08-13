import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import BidangView from "./components/BidangView";
import RakView from "./components/RakView";

type ViewState = "login" | "dashboard" | "bidang" | "rak";

interface UserSession {
    role: string;
    username: string;
    token?: string;
}

// Laravel API Base URL - sesuaikan dengan konfigurasi Laravel Anda
const API_BASE_URL = "/api";

// API utility functions
const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem("auth_token");
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    // Authentication
    async login(credentials: {
        username: string;
        password: string;
        role: string;
    }) {
        return this.request("/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    async logout() {
        return this.request("/logout", { method: "POST" });
    },

    // Bidang endpoints
    async getBidangs() {
        return this.request("/bidangs");
    },

    async getBidang(id: number) {
        return this.request(`/bidangs/${id}`);
    },

    // Rak endpoints
    async getRaks(bidangId: number) {
        return this.request(`/bidangs/${bidangId}/raks`);
    },

    async getRak(id: string) {
        return this.request(`/raks/${id}`);
    },

    async createRak(bidangId: number, data: any) {
        return this.request(`/bidangs/${bidangId}/raks`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Dokumen endpoints
    async getDokumens(rakId: string) {
        return this.request(`/raks/${rakId}/dokumens`);
    },

    async createDokumen(rakId: string, data: any) {
        return this.request(`/raks/${rakId}/dokumens`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async downloadDokumen(id: string) {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
            `${API_BASE_URL}/dokumens/${id}/download`,
            {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            }
        );

        if (!response.ok) {
            throw new Error("Download failed");
        }

        return response.blob();
    },
};

export default function App() {
    const [currentView, setCurrentView] = useState<ViewState>("login");
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [selectedBidang, setSelectedBidang] = useState<any>(null);
    const [selectedRak, setSelectedRak] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on app load
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem("auth_token");
            const userData = localStorage.getItem("user_data");

            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    setUserSession({ ...user, token });
                    setCurrentView("dashboard");
                } catch (error) {
                    console.error("Error parsing stored user data:", error);
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_data");
                }
            }
            setIsLoading(false);
        };

        checkAuthStatus();
    }, []);

    const handleLogin = async (
        role: string,
        username: string,
        password: string
    ) => {
        try {
            setIsLoading(true);

            // Untuk development, gunakan mock authentication
            // Ganti dengan panggilan API sebenarnya ketika Laravel backend sudah ready
            if (
                (role === "admin" &&
                    username === "admin" &&
                    password === "admin123") ||
                (role === "pegawai" &&
                    username === "pegawai" &&
                    password === "pegawai123")
            ) {
                // Mock response dari Laravel API
                const mockResponse = {
                    user: { id: 1, name: username, role },
                    token: "mock-jwt-token-" + Date.now(),
                };

                // Simpan session
                localStorage.setItem("auth_token", mockResponse.token);
                localStorage.setItem(
                    "user_data",
                    JSON.stringify(mockResponse.user)
                );

                setUserSession({
                    role: mockResponse.user.role,
                    username: mockResponse.user.name,
                    token: mockResponse.token,
                });
                setCurrentView("dashboard");
            } else {
                throw new Error("Invalid credentials");
            }

            // Uncomment ini ketika Laravel API sudah ready:
            /*
      const response = await api.login({ username, password, role });
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      setUserSession({ 
        role: response.user.role, 
        username: response.user.name,
        token: response.token 
      });
      setCurrentView('dashboard');
      */
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Panggil API logout jika tersedia
            // await api.logout();

            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            setUserSession(null);
            setSelectedBidang(null);
            setSelectedRak(null);
            setCurrentView("login");
        } catch (error) {
            console.error("Logout error:", error);
            // Tetap logout meskipun API call gagal
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            setUserSession(null);
            setSelectedBidang(null);
            setSelectedRak(null);
            setCurrentView("login");
        }
    };

    const handleSelectBidang = async (bidang: any) => {
        try {
            setIsLoading(true);
            // Load data bidang dari API jika perlu
            // const bidangData = await api.getBidang(bidang.id);
            setSelectedBidang(bidang);
            setCurrentView("bidang");
        } catch (error) {
            console.error("Error selecting bidang:", error);
            setSelectedBidang(bidang);
            setCurrentView("bidang");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRak = async (rak: any) => {
        try {
            setIsLoading(true);
            // Load data rak dari API jika perlu
            // const rakData = await api.getRak(rak.id);
            setSelectedRak(rak);
            setCurrentView("rak");
        } catch (error) {
            console.error("Error selecting rak:", error);
            setSelectedRak(rak);
            setCurrentView("rak");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        setSelectedBidang(null);
        setSelectedRak(null);
        setCurrentView("dashboard");
    };

    const handleBackToBidang = () => {
        setSelectedRak(null);
        setCurrentView("bidang");
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat...</p>
                </div>
            </div>
        );
    }

    // Render halaman login jika belum login
    if (currentView === "login" || !userSession) {
        return <LoginPage onLogin={handleLogin} />;
    }

    // Render view yang sesuai berdasarkan state
    switch (currentView) {
        case "dashboard":
            return (
                <Dashboard
                    role={userSession.role}
                    username={userSession.username}
                    onLogout={handleLogout}
                    onSelectBidang={handleSelectBidang}
                />
            );

        case "bidang":
            return (
                <BidangView
                    bidang={selectedBidang}
                    role={userSession.role}
                    onBack={handleBackToDashboard}
                    onSelectRak={handleSelectRak}
                />
            );

        case "rak":
            return (
                <RakView
                    rak={selectedRak}
                    bidang={selectedBidang}
                    role={userSession.role}
                    onBack={handleBackToBidang}
                />
            );

        default:
            return (
                <Dashboard
                    role={userSession.role}
                    username={userSession.username}
                    onLogout={handleLogout}
                    onSelectBidang={handleSelectBidang}
                />
            );
    }
}
