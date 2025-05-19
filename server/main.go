package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use(cors.New()) // ✅ Enable CORS (allow all origins by default)
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Code Runner API is running!")
	})

	app.Post("/run", func(c *fiber.Ctx) error {
		type RunRequest struct {
			Language string `json:"language"`
			Code     string `json:"code"`
		}

		var req RunRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"output": "Invalid JSON input"})
		}

		ext, supported := getExtension(req.Language)
		if !supported {
			return c.Status(400).JSON(fiber.Map{"output": "Unsupported language"})
		}

		// Write code to temp file
		tmpFile := filepath.Join(os.TempDir(), "code."+ext)
		if err := os.WriteFile(tmpFile, []byte(req.Code), 0644); err != nil {
			return c.Status(500).JSON(fiber.Map{"output": "Failed to write temp file"})
		}

		// Run code
		cmd := getCommand(req.Language, tmpFile)
		out, err := cmd.CombinedOutput()

		output := string(out)
		if err != nil {
			output += "\nError: " + err.Error()
		}

		return c.JSON(fiber.Map{"output": output})
	})

	log.Fatal(app.Listen(":3300"))
}

// Supported extensions
func getExtension(lang string) (string, bool) {
	switch lang {
	case "python":
		return "py", true
	case "node":
		return "js", true
	case "go":
		return "go", true
	case "cpp":
		return "cpp", true
	default:
		return "", false
	}
}

// Command per language
func getCommand(lang, file string) *exec.Cmd {
	switch lang {
	case "python":
		return exec.Command("python3", file)
	case "node":
		return exec.Command("node", file)
	case "go":
		return exec.Command("go", "run", file)
	case "cpp":
		outFile := filepath.Join(os.TempDir(), "program")
		compile := exec.Command("g++", file, "-o", outFile)
		if err := compile.Run(); err != nil {
			return exec.Command("echo", fmt.Sprintf("Compilation failed: %v", err))
		}
		return exec.Command(outFile)
	default:
		return exec.Command("echo", "Unsupported language")
	}
}
