const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema({
    watched_movie_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WatchedMovie',
        required: true
    },
    commenter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('ReviewComment', reviewCommentSchema);