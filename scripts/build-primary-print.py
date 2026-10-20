"""Готує друковані файли початкової школи з прийнятих ChatGPT Image (ImageGen) PNG.

Оригінали assets/print-primary/<name>.png не змінюються. Для кожного створюються:
  <name>.pdf          — A4 (альбомний; дзвінки — книжковий), поля 5 мм, зображення вписане без обрізання;
  <name>-print.png    — та сама сторінка A4 300 dpi для збереження;
  <name>-preview.webp — легкий перегляд для сайту.
Також week-all-classes.pdf (п’ять днів) і manifest.json з контрольними сумами.
Запуск: python scripts/build-primary-print.py   (з кореня сайту; потрібен Pillow)
"""
import hashlib, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / 'assets' / 'print-primary'
DPI = 300
A4 = (3508, 2480)            # 297×210 мм при 300 dpi
MARGIN = round(5 / 25.4 * DPI)
CLASSES = ['class-1', 'class-2', 'class-3', 'class-4']
DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
PORTRAIT = {'bells'}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def a4_page(name):
    src = Image.open(DIR / f'{name}.png').convert('RGB')
    size = A4[::-1] if name in PORTRAIT else A4
    box = (size[0] - 2 * MARGIN, size[1] - 2 * MARGIN)
    scale = min(box[0] / src.width, box[1] / src.height)
    fitted = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
    page = Image.new('RGB', size, 'white')
    page.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return src, page

def main():
    manifest = {'generationMethod': 'ChatGPT Image (Codex built-in image_gen), originals unmodified',
                'format': 'A4, margins 5 mm', 'posters': []}
    pages = {}
    for name in CLASSES + DAYS + ['bells']:
        src, page = a4_page(name)
        pages[name] = page
        page.save(DIR / f'{name}.pdf', 'PDF', resolution=DPI, quality=93)
        page.save(DIR / f'{name}-print.png', optimize=True, dpi=(DPI, DPI))
        preview = src.copy()
        preview.thumbnail((1400, 1400), Image.LANCZOS)
        preview.save(DIR / f'{name}-preview.webp', 'WEBP', quality=86, method=6)
        manifest['posters'].append({'name': name, 'width': src.width, 'height': src.height,
                                    'sha256': sha(DIR / f'{name}.png'),
                                    'prompt': f'assets/print-primary-generation/{name}-prompt.txt'})
    first, *rest = [pages[d] for d in DAYS]
    first.save(DIR / 'week-all-classes.pdf', 'PDF', resolution=DPI, quality=93, save_all=True, append_images=rest)
    (DIR / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Готово:', len(manifest['posters']), 'плакатів')

if __name__ == '__main__':
    main()
