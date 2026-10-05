import os

def search_global_ops(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'global_operations' in content or 'siteconfig' in content.lower():
                            print(f"Found match in: {path}")
                except Exception as e:
                    pass

search_global_ops("C:\\Users\\gunas\\.gemini\\antigravity\\scratch\\m1g-web-app\\src")
