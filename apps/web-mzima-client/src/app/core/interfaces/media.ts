enum MediaUploaderError {
  NONE = 'none',
  MAX_SIZE = 'post.media.messages.max_size',
  REQUIRED = 'post.media.messages.required',
  INVALID_TYPE = 'post.media.messages.invalid_type',
  MAX_FILES = 'post.media.messages.max_files',
}

type MediaType = {
  icon: string;
  buttonText: string;
  fileTypes: string;
};

const mediaTypes = new Map<string, MediaType>([
  [
    'image',
    {
      icon: 'add_a_photo',
      buttonText: 'post.media.add_photo',
      fileTypes: 'image/jpeg, image/png',
    },
  ],
  [
    'audio',
    {
      icon: 'speaker',
      buttonText: 'post.media.add_audio',
      fileTypes:
        'audio/mp3, audio/mpeg, audio/ogg, audio/aac, audio/mp4, audio/webm, audio/webm;codecs=opus, audio/ogg;codecs=opus',
    },
  ],
  [
    'document',
    {
      icon: 'note_add',
      buttonText: 'post.media.add_document',
      fileTypes:
        'application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  ],
  [
    'video',
    {
      icon: 'videocam',
      buttonText: 'post.media.add_video',
      fileTypes: 'video/mp4, video/webm, video/ogg, video/quicktime',
    },
  ],
]);

export { MediaType, MediaUploaderError, mediaTypes };
