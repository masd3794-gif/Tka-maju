"""
TKAMAJU — Backend Python (Flask)
=================================
Menjalankan server web yang:
  1. Menyajikan halaman index.html + file CSS/JS statis
  2. Menyediakan REST API untuk registrasi, login, update poin,
     dan papan peringkat (leaderboard)
  3. Menyimpan data pengguna ke file JSON sederhana (data/users.json)
     — cocok untuk latihan/prototipe, silakan ganti ke database
     (SQLite/PostgreSQL) untuk pemakaian produksi sungguhan.

Cara menjalankan:
  1. pip install flask
  2. python app.py
  3. Buka http://localhost:5000 di browser
"""

import json
import os
import re
from datetime import datetime
from threading import Lock

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

os.makedirs(DATA_DIR, exist_ok=True)
_lock = Lock()  # mencegah tabrakan tulis file saat banyak request bersamaan

VALID_JENJANG = {"sd", "smp", "sma"}
USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,20}$")


# ---------------------------------------------------------------------
# Penyimpanan data (JSON sederhana)
# ---------------------------------------------------------------------
def load_users():
    """Baca seluruh data pengguna dari file JSON. Kembalikan dict kosong jika belum ada."""
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def save_users(users: dict):
    """Simpan seluruh data pengguna ke file JSON."""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def public_user(user: dict) -> dict:
    """Kembalikan data pengguna tanpa kata sandi, aman dikirim ke frontend."""
    return {
        "name": user["name"],
        "username": user["username"],
        "jenjang": user["jenjang"],
        "points": user["points"],
    }


# ---------------------------------------------------------------------
# Halaman utama
# ---------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------
# API: Registrasi akun baru
# ---------------------------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    username = (body.get("username") or "").strip().lower()
    password = body.get("password") or ""
    jenjang = body.get("jenjang") or ""

    if not name or not username or len(password) < 4:
        return jsonify({"error": "Lengkapi semua data. Kata sandi minimal 4 karakter."}), 400
    if not USERNAME_PATTERN.match(username):
        return jsonify({"error": "Nama pengguna hanya boleh huruf kecil, angka, dan garis bawah (3-20 karakter)."}), 400
    if jenjang not in VALID_JENJANG:
        return jsonify({"error": "Jenjang sekolah tidak valid."}), 400

    with _lock:
        users = load_users()
        if username in users:
            return jsonify({"error": "Nama pengguna sudah dipakai, coba nama lain."}), 409

        users[username] = {
            "name": name,
            "username": username,
            "password": password,  # DEMO: teks biasa. Untuk produksi, gunakan hashing (werkzeug.security).
            "jenjang": jenjang,
            "points": 0,
            "created_at": datetime.utcnow().isoformat(),
        }
        save_users(users)

    return jsonify({"user": public_user(users[username])}), 201


# ---------------------------------------------------------------------
# API: Login
# ---------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip().lower()
    password = body.get("password") or ""

    users = load_users()
    user = users.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Nama pengguna atau kata sandi salah."}), 401

    return jsonify({"user": public_user(user)}), 200


# ---------------------------------------------------------------------
# API: Tambah poin (dipanggil setelah kuis mode Rank selesai)
# ---------------------------------------------------------------------
@app.route("/api/update_points", methods=["POST"])
def update_points():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip().lower()
    add_points = body.get("add_points")

    if not isinstance(add_points, int) or add_points < 0:
        return jsonify({"error": "Jumlah poin tidak valid."}), 400

    with _lock:
        users = load_users()
        user = users.get(username)
        if not user:
            return jsonify({"error": "Pengguna tidak ditemukan."}), 404

        user["points"] += add_points
        save_users(users)

    return jsonify({"user": public_user(user)}), 200


# ---------------------------------------------------------------------
# API: Papan peringkat per jenjang
# ---------------------------------------------------------------------
@app.route("/api/leaderboard/<jenjang>", methods=["GET"])
def leaderboard(jenjang):
    if jenjang not in VALID_JENJANG:
        return jsonify({"error": "Jenjang tidak valid."}), 400

    users = load_users()
    filtered = [public_user(u) for u in users.values() if u["jenjang"] == jenjang]
    filtered.sort(key=lambda u: u["points"], reverse=True)

    return jsonify({"users": filtered[:50]}), 200


if __name__ == "__main__":
    # debug=True hanya untuk pengembangan lokal — matikan saat dipakai publik/produksi
    app.run(host="0.0.0.0", port=5000, debug=True)
