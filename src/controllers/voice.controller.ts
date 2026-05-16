import axios from "axios";

export const testSarvamVoice = async (req, res) => {
  try {
    const { text = "Namaste, yeh ek test voice hai", voice = "bulbul:v3" } = req.body;

    const response = await axios.post(
      "https://api.sarvam.ai/v1/audio/speech",
      {
        model: voice,
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
        },
        responseType: "arraybuffer",
      }
    );

    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(response.data);

  } catch (error) {
    console.error(error?.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "TTS failed",
    });
  }
};