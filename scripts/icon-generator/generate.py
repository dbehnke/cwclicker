import os
import subprocess
from PIL import Image


def generate_image(prompt, output_filename, steps=4):
    print(f"Generating image for prompt: '{prompt}'")
    # Using mflux-generate (FLUX.1-schnell model)
    mflux_path = (
        "/Users/dbehnke/openclaw-workspace/image-generation/.venv/bin/mflux-generate"
    )
    cmd = [
        mflux_path,
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
    # Base aesthetic part
    aesthetic = "Perfect 2D pixel art style, retro 16-bit video game inventory icon, flat vibrant colors, clear dark outlines, on solid black background."

    # Prompt Dictionary - Updating with Amateur Radio/Morse context
    prompts = {
        # --- PHASE 1 REGENERATIONS (Upgrades) ---
        "src/assets/icons/upgrades/bronze-upgrade.png": f"A bronze ham radio operator trophy. {aesthetic}",
        "src/assets/icons/upgrades/silver-upgrade.png": f"A silver ham radio operator trophy. {aesthetic}",
        # --- PHASE 2 REGENERATIONS (Straight Key Fix) ---
        "src/assets/icons/factories/straight-key.png": f"A classic amateur radio morse code straight key made of brass and wood on a heavy base. {aesthetic}",
        # --- PHASE 3: MISSING FACTORIES (Amateur Radio / Morse Code Themed) ---
        "src/assets/icons/factories/qrq-protocol.png": f"High-speed Morse code telegraph keyer, amateur radio style. {aesthetic}",
        "src/assets/icons/factories/code-practice-oscillator.png": f"A small vintage radio buzzer box with a speaker for Morse code practice. {aesthetic}",
        "src/assets/icons/factories/bug-catcher.png": f"A classic semi-automatic mechanical 'Bug' telegraph key for Morse code. {aesthetic}",
        "src/assets/icons/factories/linear-amplifier.png": f"A powerful amateur radio linear amplifier with two analog power meters on the front. {aesthetic}",
        "src/assets/icons/factories/ragchew-net.png": f"A group of four small amateur radio handheld walkie-talkies. {aesthetic}",
        "src/assets/icons/factories/tower-installation.png": f"A tall steel lattice radio tower with multiple antennas. {aesthetic}",
        "src/assets/icons/factories/contest-station.png": f"A modern amateur radio transceiver with a digital waterfall display. {aesthetic}",
        "src/assets/icons/factories/paper-logbook.png": f"A spiral-bound paper logbook for recording amateur radio contacts. {aesthetic}",
        "src/assets/icons/factories/dx-cluster.png": f"A retro computer terminal screen showing text-based radio spots. {aesthetic}",
        "src/assets/icons/factories/hamfest.png": f"A classic radio equipment swap meet table with junk and gear. {aesthetic}",
        "src/assets/icons/factories/qsl-card-printer.png": f"A stack of colorful paper QSL cards from around the world. {aesthetic}",
        "src/assets/icons/factories/remote-station.png": f"A small antenna tower on a tropical island with palm trees. {aesthetic}",
        "src/assets/icons/factories/ft8-bot.png": f"A friendly robot using a computer to make FT8 digital radio contacts. {aesthetic}",
        "src/assets/icons/factories/digital-interface.png": f"A small electronic signal interface box with cables for digital radio modes. {aesthetic}",
        "src/assets/icons/factories/cluster-spotting-network.png": f"A global network of connected radio antennas. {aesthetic}",
        "src/assets/icons/factories/eme-moonbounce.png": f"A giant satellite dish pointing at a crescent moon. {aesthetic}",
        "src/assets/icons/factories/lunar-repeater.png": f"A radio antenna placed on the surface of the moon. {aesthetic}",
        "src/assets/icons/factories/satellite-constellation.png": f"Multiple small low-earth-orbit satellites in space. {aesthetic}",
        "src/assets/icons/factories/ionospheric-modification.png": f"A large array of antennas beaming energy into the sky. {aesthetic}",
        "src/assets/icons/factories/time-travel-dx.png": f"A futuristic sci-fi radio that can work stations in the past. {aesthetic}",
        "src/assets/icons/factories/alternate-dimension-dxcc.png": f"A glowing interdimensional portal with a radio antenna. {aesthetic}",
        # --- FUTURE PREP ---
        "src/assets/icons/misc/achievement.png": f"A gold trophy with a radio antenna on top for amateur radio achievements. {aesthetic}",
    }

    # Ensure paths are correct relative to project root
    project_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    os.makedirs(
        os.path.join(project_root, "scripts", "icon-generator", "temp"), exist_ok=True
    )

    for rel_path, prompt in prompts.items():
        final_path = os.path.join(project_root, rel_path)

        # Check if file already exists
        full_final_path = os.path.abspath(final_path)
        if os.path.exists(full_final_path):
            print(f"Skipping {full_final_path} (already exists)")
            continue

        base_name = os.path.basename(final_path)
        temp_path = os.path.join(
            project_root, "scripts", "icon-generator", "temp", base_name
        )

        # We assume the script is run from scripts/icon-generator
        full_final_path = os.path.abspath(final_path)
        os.makedirs(os.path.dirname(full_final_path), exist_ok=True)

        generate_image(prompt, temp_path)
        remove_background(temp_path, full_final_path)
        print(f"Saved final transparent icon to {full_final_path}\n")


if __name__ == "__main__":
    main()
