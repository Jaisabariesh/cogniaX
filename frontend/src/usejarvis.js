import React, { useState, useRef } from 'react';

export default function useJarvis() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);

  // Dummy JSON data (you can replace this with your real notes JSON)
  const notes = [
    { type: 'heading', content: 'Chapter 1: Gravity' },
    { type: 'paragraph', content: 'Gravity is a force of attraction between masses.' },
    { type: 'question', content: 'What is gravity?' },
    { type: 'answer', content: 'Gravity is the force that pulls objects toward each other.' },
    { type: 'note', content: 'Remember Newton\'s law of universal gravitation.' }
  ];

  // Filter unwanted content like [1], [], etc.
  function cleanText(text) {
    return text.replace(/\\[.*?\\]|\\d+|\\s{2,}/g, '').trim();
  }

  // Speak with spacing between nodes
  function speakNotes() {
    if (!window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Stop any current speech
    synthRef.current = synth;

    let index = 0;

    function speakNext() {
      if (index >= notes.length) return;

      const note = notes[index++];
      const text = cleanText(note.content);

      if (!text) {
        speakNext(); // Skip empty content
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;

      utter.onend = () => {
        // Add a pause before the next note
        setTimeout(speakNext, 500);
      };

      synth.speak(utter);
    }

    speakNext();
  }

  // Speech recognition setup
  function startListening() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => console.error('Voice Error:', e.error);
    recognition.onresult = (e) => {
      const result = e.results[0][0].transcript.trim();
      setTranscript(result);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopSpeaking() {
    if (synthRef.current) synthRef.current.cancel();
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
      <h2>🎙️ Voice Note Reader</h2>
      <button onClick={speakNotes}>🔊 Read Notes</button>
      <button onClick={startListening} disabled={listening}>
        🎤 {listening ? 'Listening...' : 'Start Voice Input'}
      </button>
      <button onClick={stopSpeaking}>⏹️ Stop Reading</button>

      <div style={{ marginTop: '1rem' }}>
        <strong>Heard:</strong> {transcript}
      </div>
    </div>
  );
}
