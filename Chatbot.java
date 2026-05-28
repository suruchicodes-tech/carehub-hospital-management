package hospital.management.system;

import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class Chatbot extends JFrame {

    public Chatbot() {
        setTitle("Hospital AI Assistant");
        setSize(400, 600);
        setLayout(new BorderLayout());
        setLocationRelativeTo(null);

        // Build Header Panel with Logo
        JPanel headerPanel = new JPanel();
        headerPanel.setBackground(new Color(109, 164, 170));
        headerPanel.setLayout(new FlowLayout(FlowLayout.CENTER, 10, 10));

        try {
            java.net.URL imgURL = ClassLoader.getSystemResource("icon/chatbot.png");
            if (imgURL != null) {
                ImageIcon icon = new ImageIcon(imgURL);
                Image img = icon.getImage().getScaledInstance(60, 60, Image.SCALE_SMOOTH);
                JLabel logoLabel = new JLabel(new ImageIcon(img));
                headerPanel.add(logoLabel);
            }
        } catch (Exception e) {
            System.out.println("Logo icon error: " + e.getMessage());
        }

        JLabel titleLabel = new JLabel("Hospital AI Assistant");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 20));
        titleLabel.setForeground(Color.WHITE);
        headerPanel.add(titleLabel);

        add(headerPanel, BorderLayout.NORTH);

        JTextArea chatArea = new JTextArea();
        chatArea.setEditable(false);
        chatArea.setLineWrap(true);
        chatArea.setWrapStyleWord(true);
        chatArea.setFont(new Font("Arial", Font.PLAIN, 14));
        chatArea.append("Bot: Hello! 👋 Welcome to our Hospital! How can I help you today?\n\n");

        JTextField inputField = new JTextField();
        inputField.setFont(new Font("Arial", Font.PLAIN, 14));
        inputField.setPreferredSize(new Dimension(400, 40));

        JPanel bottomPanel = new JPanel(new BorderLayout());
        JButton sendButton = new JButton("Send");
        sendButton.setBackground(new Color(109, 164, 170));
        sendButton.setForeground(Color.WHITE);
        sendButton.setFont(new Font("Arial", Font.BOLD, 14));

        bottomPanel.add(inputField, BorderLayout.CENTER);
        bottomPanel.add(sendButton, BorderLayout.EAST);

        add(new JScrollPane(chatArea), BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);

        // Action when pressing Enter or clicking Send
        Runnable sendAction = () -> {
            String userText = inputField.getText().trim();
            if (userText.isEmpty()) return;

            chatArea.append("You: " + userText + "\n");
            inputField.setText("");

            new Thread(() -> {
                String reply = CallopenAIAPI(userText);
                SwingUtilities.invokeLater(() -> {
                    chatArea.append("Bot: " + reply + "\n\n");
                    chatArea.setCaretPosition(chatArea.getDocument().getLength());
                });
            }).start();
        };

        inputField.addActionListener(e -> sendAction.run());
        sendButton.addActionListener(e -> sendAction.run());

        setVisible(true);
    }

    public static String CallopenAIAPI(String message) {
        String msg = message.toLowerCase();

        // ✅ CUSTOM HOSPITAL ANSWERS
        if (msg.contains("hello") || msg.contains("hi")) {
            return "Hello 👋 Welcome to our Hospital! How can I help you today?";
        }
        if (msg.contains("room") && msg.contains("available")) {
            return "Yes ✅ Rooms are available. Please visit reception for booking.";
        }
        if (msg.contains("doctor") && msg.contains("available")) {
            return "Yes 👨‍⚕️ Doctors are available in our hospital.";
        }
        if (msg.contains("doctor") && (msg.contains("meet") || msg.contains("appointment"))) {
            return "To meet a doctor 🏥, first login, then register your name at reception. Staff will inform you.";
        }
        if (msg.contains("timing") || msg.contains("time")) {
            return "🕒 Hospital timing is 9 AM to 8 PM.";
        }
        if (msg.contains("emergency")) {
            return "🚨 Emergency service is available 24/7.";
        }
        if (msg.contains("thank")) {
            return "You're welcome 😊 Stay healthy!";
        }

        // 🤖 AI FALLBACK (OpenAI API)
        try {
            String apiKey = "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";
            String apiUrl = "https://api.openai.com/v1/chat/completions";

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            // Correct JSON for Chat Completions API
            String safeMessage = message.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
            String jsonInputString = "{"
                    + "\"model\": \"gpt-3.5-turbo\","
                    + "\"messages\": [{\"role\": \"user\", \"content\": \"" + safeMessage + "\"}]"
                    + "}";

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            InputStream is = (responseCode >= 200 && responseCode < 300) ? conn.getInputStream() : conn.getErrorStream();

            StringBuilder response = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, "utf-8"))) {
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
            }

            String res = response.toString();
            
            if (responseCode >= 200 && responseCode < 300) {
                // Parse the "content" from OpenAI's actual response structure
                String target = "\"content\": \"";
                int start = res.indexOf(target);
                if (start != -1) {
                    start += target.length();
                    int end = res.indexOf("\"", start);
                    // Skip escaped quotes
                    while (end != -1 && res.charAt(end - 1) == '\\') {
                        end = res.indexOf("\"", end + 1);
                    }
                    if (end != -1) {
                        String content = res.substring(start, end);
                        return content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
                    }
                }
            } else {
                return "AI Error: " + res;
            }

        } catch (Exception e) {
            return "Connection Error: " + e.getMessage();
        }

        return "Sorry, I didn't understand. Can you please be more specific?";
    }

    public static void main(String[] args) {
        new Chatbot();
    }
}