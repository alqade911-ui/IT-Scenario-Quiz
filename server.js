const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// الملفات موجودة في المجلد الرئيسي
app.use(express.static("."));

let leaderboard = [];

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.emit("leaderboard", leaderboard);

    socket.on("submitScore", (data) => {

        if (!data) return;

        const name = String(data.name || "").trim().slice(0, 30);
        const score = Number(data.score);
        const correct = Number(data.correct);
        const total = Number(data.total);
        const time = Number(data.time);

        if (!name) return;
        if (!Number.isFinite(score)) return;
        if (!Number.isFinite(correct)) return;
        if (!Number.isFinite(total)) return;
        if (!Number.isFinite(time)) return;

        const safeScore = Math.max(0, score);
        const safeCorrect = Math.max(0, Math.min(correct, total));
        const safeTime = Math.max(0, time);

        const playerId = String(data.playerId || socket.id);

        const existingIndex = leaderboard.findIndex(
            player => player.playerId === playerId
        );

        const playerData = {
            playerId,
            name,
            score: safeScore,
            correct: safeCorrect,
            total,
            time: safeTime,
            updatedAt: Date.now()
        };

        if (existingIndex !== -1) {
            leaderboard[existingIndex] = playerData;
        } else {
            leaderboard.push(playerData);
        }

        // الترتيب:
        // 1- النقاط الأعلى
        // 2- الإجابات الصحيحة الأكثر
        // 3- الوقت الأقل
        leaderboard.sort((a, b) => {

            if (b.score !== a.score) {
                return b.score - a.score;
            }

            if (b.correct !== a.correct) {
                return b.correct - a.correct;
            }

            return a.time - b.time;
        });

        leaderboard = leaderboard.slice(0, 100);

        io.emit("leaderboard", leaderboard);
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`IT Scenario Quiz running on port ${PORT}`);
});
