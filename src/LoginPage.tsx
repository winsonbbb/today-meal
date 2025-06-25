// src/LoginPage.tsx

import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "register">("login");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/${mode}`, {
                username,
                password,
            });
            localStorage.setItem("mealdraw_token", res.data.token);
            localStorage.setItem("mealdraw_user", username);
            onLogin();
        } catch (err: any) {
            setError(err.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-20 p-4 border rounded bg-white shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">
                {mode === "login" ? "Login" : "Register"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full border p-2 rounded"
                    required
                />
                <input
                    value={password}
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full border p-2 rounded"
                    required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {mode === "login" ? "Login" : "Register"}
                </button>
            </form>
            <p className="mt-4 text-center text-sm">
                {mode === "login" ? (
                    <>
                        No account?{" "}
                        <button
                            className="text-blue-600 underline"
                            onClick={() => setMode("register")}
                        >
                            Register here
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button
                            className="text-blue-600 underline"
                            onClick={() => setMode("login")}
                        >
                            Login
                        </button>
                    </>
                )}
            </p>
        </div>
    );
}
