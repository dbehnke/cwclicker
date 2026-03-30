import os
import subprocess
from rembg import remove
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
    print(f"Removing background from {input_path}")
    input_image = Image.open(input_path)
    output_image = remove(input_image)

    # Save the output image
    output_image.save(output_path, "PNG")


def main():
    prompts = {
        "../../src/assets/icons/upgrades/bronze-upgrade.png": "A bronze gear or cog. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, isolated on a solid white background.",
        "../../src/assets/icons/upgrades/silver-upgrade.png": "A silver gear or cog. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, isolated on a solid white background.",
        "../../src/assets/icons/upgrades/gold-upgrade.png": "A shiny gold gear or cog. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, isolated on a solid white background.",
        "../../src/assets/icons/misc/dx-bonus.png": "A glowing treasure chest radiating magical energy. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, isolated on a solid white background.",
        "../../src/assets/icons/misc/solar-storm.png": "A fierce solar flare or sun erupting with fire. Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, isolated on a solid white background.",
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
