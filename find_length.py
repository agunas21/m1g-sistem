import re

with open(r"C:\Users\gunas\.gemini\antigravity\scratch\m1g-web-app\src\app\admin\operasyonlar\page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if ".length" in line:
        print(f"Line {idx+1}: {line.strip()}")
