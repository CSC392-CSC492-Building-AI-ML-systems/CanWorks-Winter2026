"use client";
import React from "react";
import axios from "axios";


export default function SigningUp() {
    async function handleSubmit() {
        let response = await axios.post("/api/login", {
            mydata: "This is a test"
        });
        console.log(response.data);

        let response2 = await axios.get("http://127.0.0.1:8000/");
        console.log(response2.data);
    }
return (
    <div className="min-h-screen bg-gray-50">
        <button
        onClick={handleSubmit}
        >Submit</button>
    </div>
    );
}
