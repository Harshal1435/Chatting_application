import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'ongoing', 'missed', 'rejected', 'ended', 'failed'],
      default: 'initiated'
    },
    startedAt: {
      type: Date,
      required: true
    },
    answeredAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    // For group calls (future enhancement)
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        joinedAt: Date,
        leftAt: Date,
        duration: Number
      }
    ],
    // Call quality metrics (optional)
    qualityMetrics: {
      audioQuality: {
        type: Number,
        min: 1,
        max: 5
      },
      videoQuality: {
        type: Number,
        min: 1,
        max: 5
      },
      connectionStability: {
        type: Number,
        min: 1,
        max: 5
      }
    },
    // For call recording (if implemented)
    recording: {
      url: String,
      storagePath: String,
      duration: Number,
      createdAt: Date
    },
    // Additional metadata
    callerDeviceInfo: {
      os: String,
      browser: String,
      ipAddress: String
    },
    receiverDeviceInfo: {
      os: String,
      browser: String,
      ipAddress: String
    },
    // For analytics
    callDropReason: String,
    retryAttempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for faster querying
callSchema.index({ caller: 1, status: 1 });
callSchema.index({ receiver: 1, status: 1 });
callSchema.index({ startedAt: -1 });
callSchema.index({ callType: 1, status: 1 });

// Virtual for call duration (in minutes)
callSchema.virtual('durationMinutes').get(function() {
  return this.duration ? (this.duration / 60).toFixed(2) : 0;
});

// Pre-save hook to calculate duration
callSchema.pre('save', function(next) {
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  next();
});

const Call = mongoose.model('Call', callSchema);

export default Call;