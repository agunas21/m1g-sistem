import os

def search_env_err(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME' in content:
                            print(f"Found match: {path}")
                except Exception as e:
                    pass

search_env_err("C:\\Users\\gunas\\.gemini\\antigravity\\scratch\\m1g-web-app\\src")
