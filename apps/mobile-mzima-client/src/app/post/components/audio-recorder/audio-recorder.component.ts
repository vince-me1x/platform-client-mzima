import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const AUDIO_DIR = 'ush-audio';

export interface RecordedAudio {
  data: string;
  name: string;
  path: string;
  mimeType: string;
}

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss'],
})
export class AudioRecorderComponent implements OnDestroy {
  @Output() audioRecorded = new EventEmitter<RecordedAudio>();

  isRecording = false;
  hasPermission = false;
  permissionDenied = false;
  recordingDuration = 0;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private durationInterval: ReturnType<typeof setInterval> | null = null;

  async requestPermissionAndStart() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.hasPermission = true;
      this.permissionDenied = false;
      this.startRecording(stream);
    } catch (err: any) {
      console.error('Microphone permission denied or error:', err);
      this.permissionDenied = true;
      this.hasPermission = false;
    }
  }

  private startRecording(stream: MediaStream) {
    this.recordedChunks = [];
    this.recordingDuration = 0;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    this.mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      this.saveAndEmitRecording(mimeType);
    };

    this.mediaRecorder.start();
    this.isRecording = true;

    this.durationInterval = setInterval(() => {
      this.recordingDuration++;
    }, 1000);
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }
    }
  }

  private async saveAndEmitRecording(mimeType: string) {
    const ext = mimeType.startsWith('audio/ogg') ? 'ogg' : 'webm';
    const fileName = `recorded-audio-${Date.now()}.${ext}`;
    const blob = new Blob(this.recordedChunks, { type: mimeType });

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1];
      try {
        if (Capacitor.getPlatform() !== 'web') {
          await this.ensureDir();
          await Filesystem.writeFile({
            path: `${AUDIO_DIR}/${fileName}`,
            data: base64data,
            directory: Directory.Data,
          });
          const fileUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: `${AUDIO_DIR}/${fileName}`,
          });
          const dataUrl = `data:${mimeType};base64,${base64data}`;
          this.audioRecorded.emit({
            data: dataUrl,
            name: fileName,
            path: `${AUDIO_DIR}/${fileName}`,
            mimeType,
          });
        } else {
          // On web, emit the blob URL directly
          const dataUrl = `data:${mimeType};base64,${base64data}`;
          this.audioRecorded.emit({
            data: dataUrl,
            name: fileName,
            path: fileName,
            mimeType,
          });
        }
      } catch (err) {
        console.error('Error saving recorded audio:', err);
      }
    };
    reader.readAsDataURL(blob);
  }

  private async ensureDir() {
    try {
      await Filesystem.readdir({
        directory: Directory.Data,
        path: AUDIO_DIR,
      });
    } catch {
      await Filesystem.mkdir({
        directory: Directory.Data,
        path: AUDIO_DIR,
        recursive: true,
      });
    }
  }

  get formattedDuration(): string {
    const m = Math.floor(this.recordingDuration / 60);
    const s = this.recordingDuration % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }
}
