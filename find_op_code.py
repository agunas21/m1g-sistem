import os

def search_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'operation' in content.lower() or 'operasyon' in content.lower():
                            if 'create' in content.lower() or 'post' in content.lower() or 'prisma' in content.lower():
                                print(f"Match: {path}")
                except Exception as e:
                    pass

search_files("C:\\Users\\gunas\\.gemini\\antigravity\\scratch\\m1g-web-app\\src")
