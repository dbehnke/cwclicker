import os
import subprocess
from PIL import Image


def generate_image(prompt, output_filename, steps=4):
    print(f"Generating image for prompt: '{prompt}'")
    # Using mflux-generate (FLUX.1-schnell model)
    cmd = [
        "mflux-generate",
        "--model",
        "schnell",
        "--prompt",
        prompt,
        "--steps",
        str(steps),
        "--seed",
        "42",
        "--output",
        output_filename,
    ]
    subprocess.run(cmd, check=True)


def remove_background(input_path, output_path):
    print(f"Copying icon (keeping dark background): {input_path}")
    # Keep the black background - works well on dark UI themes
    input_image = Image.open(input_path)
    input_image.save(output_path, "PNG")


def main():
    # Phase 2: Core Factories
    prompts = {
        "../../src/assets/icons/factories/straight-key.png": "A classic morse code straight key made of brass and wood. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
        "../../src/assets/icons/factories/paddle-key.png": "A modern iambic paddle morse code key with chrome levers. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
        "../../src/assets/icons/factories/dipole-antenna.png": "A horizontal dipole antenna wire strung between two insulators. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
        "../../src/assets/icons/factories/vertical-antenna.png": "A tall aluminum vertical radio antenna mast. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
        "../../src/assets/icons/factories/beam-antenna.png": "A multi-element Yagi beam radio antenna on a short tower. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
        "../../src/assets/icons/factories/elmer.png": "A friendly older man wearing headphones and a radio vest, representing a mentor. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background.",
    }

    os.makedirs("temp", exist_ok=True)

    for final_path, prompt in prompts.items():
        base_name = os.path.basename(final_path)
        temp_path = os.path.join("temp", base_name)

        # We assume the script is run from scripts/icon-generator
        full_final_path = os.path.abspath(final_path)
        os.makedirs(os.path.dirname(full_final_path), exist_ok=True)

        generate_image(prompt, temp_path)
        remove_background(temp_path, full_final_path)
        print(f"Saved final transparent icon to {full_final_path}\n")


if __name__ == "__main__":
    main()
