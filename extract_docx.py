import zipfile
import xml.etree.ElementTree as ET
import os

docx_file = "FAALİYET RAPORU OCAK-MART 2026.docx"
extract_dir = "public/images/faaliyetler"
temp_media_dir = os.path.join(extract_dir, "word", "media")

if not os.path.exists(extract_dir):
    os.makedirs(extract_dir)

with zipfile.ZipFile(docx_file, 'r') as docx:
    # 1. Extract Images
    media_files = [f for f in docx.namelist() if f.startswith('word/media/')]
    for file in media_files:
        # Extract to extract_dir, this will create extract_dir/word/media/...
        docx.extract(file, extract_dir)
        
    # Move them directly to extract_dir
    if os.path.exists(temp_media_dir):
        for img_file in os.listdir(temp_media_dir):
            os.rename(os.path.join(temp_media_dir, img_file), os.path.join(extract_dir, img_file))
        # Cleanup
        os.rmdir(temp_media_dir)
        os.rmdir(os.path.join(extract_dir, "word"))
            
    print(f"Extracted {len(media_files)} images to {extract_dir}.")

    # 2. Extract Text
    content = docx.read('word/document.xml')
    tree = ET.fromstring(content)
    
    # XML namespace for Word
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for p in tree.iterfind('.//w:p', ns):
        texts = [t.text for t in p.iterfind('.//w:t', ns) if t.text]
        if texts:
            paragraphs.append(''.join(texts))

    with open("extracted_text.txt", "w", encoding="utf-8") as f:
        f.write('\n'.join(paragraphs))
    print(f"Extracted {len(paragraphs)} paragraphs of text.")
