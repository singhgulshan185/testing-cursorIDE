# MIT Scratch Clone 🎮

## 🌟 Live Demo
**[👉 TRY IT NOW ON VERCEL 👈](https://testing-cursoride.vercel.app/)**

📹 **[Watch Demo Video](https://drive.google.com/file/d/1KRc_b02rd1FwHA6Cj0dxg-WDc99QwpFJ/view?usp=sharing)**

A lightweight, React-based visual coding platform inspired by MIT Scratch. Built for educational purposes.

![Project Screenshot](https://github.com/user-attachments/assets/578453c3-d00e-4914-973d-548b4b0d5472)

---

## 🚀 Features

### 🎮 Motion Animations
- `Move [X] steps`
- `Turn [X] degrees`
- `Go to x: [X], y: [Y]`
- `Repeat [block]` loop under Controls

### 😃 Looks Animations
- `Say [message] for [X] seconds`
- `Think [message] for [X] seconds`

### 🧩 Drag-and-Drop Blocks
- All blocks are draggable and snap together like in Scratch
- Seamless block programming experience

### 🧸 Multiple Sprites Support
- Create and manage multiple sprites
- Each sprite can run its own set of animation blocks
- Global **Play** button to trigger all animations at once

### 🦸 Hero Feature: Collision-Based Animation Swap
- When two sprites collide, their animations dynamically swap
  - Example:  
    - Sprite A: Move 10 steps  
    - Sprite B: Move -10 steps  
    - On collision:  
      - Sprite A: Move -10 steps  
      - Sprite B: Move 10 steps  
- Brings interactive game-like logic to the platform
---

## 🛠️ Tech Stack

- ReactJS + TailwindCSS  
- Webpack (Custom config)  
- Vercel (Deployment)

---

## 📦 Getting Started

```bash
git clone https://github.com/singhgulshan185/testing-CursorIDE.git
cd testing-CursorIDE
npm install
npm start
```

## Troubleshooting

If you encounter issues with missing modules like babel-loader:

1. Remove node_modules directory:
   ```
   rm -rf node_modules
   ```
   
2. Reinstall with pnpm:
   ```
   pnpm install
   ```

3. If port 3001 is already in use:
   ```
   # Find the process using port 3001
   lsof -i :3001
   
   # Kill the process (replace PID with the actual process ID)
   kill -9 PID
   ```

## Technologies Used

- React
- Tailwind CSS
- Webpack
- ReScript (optional) 
