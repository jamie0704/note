// 初始化 marked 設定
marked.setOptions({
    highlight: function(code, lang) {
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

class NoteApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
        this.currentNoteId = null;
        this.initElements();
        this.bindEvents();
        this.renderNotesList();
        
        // 檢查 URL 是否包含分享的筆記
        const urlParams = new URLSearchParams(window.location.search);
        const sharedNote = urlParams.get('note');
        if (sharedNote) {
            try {
                const noteData = JSON.parse(atob(sharedNote));
                this.notes.push({
                    id: Date.now(),
                    title: noteData.title,
                    content: noteData.content,
                    created: new Date().toISOString()
                });
                this.saveNotes();
                this.renderNotesList();
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error('無法解析分享的筆記', e);
            }
        }
    }

    initElements() {
        this.elements = {
            notesList: document.getElementById('notesList'),
            noteTitle: document.getElementById('noteTitle'),
            noteContent: document.getElementById('noteContent'),
            saveBtn: document.getElementById('saveBtn'),
            shareBtn: document.getElementById('shareBtn'),
            newNoteBtn: document.getElementById('newNoteBtn'),
            editBtn: document.getElementById('editBtn'),
            previewBtn: document.getElementById('previewBtn'),
            editorArea: document.getElementById('editorArea'),
            previewArea: document.getElementById('previewArea'),
            shareModal: new bootstrap.Modal(document.getElementById('shareModal')),
            shareLink: document.getElementById('shareLink'),
            copyBtn: document.getElementById('copyBtn')
        };
    }

    bindEvents() {
        this.elements.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.elements.saveBtn.addEventListener('click', () => this.saveCurrentNote());
        this.elements.shareBtn.addEventListener('click', () => this.shareNote());
        this.elements.editBtn.addEventListener('click', () => this.toggleEditMode(true));
        this.elements.previewBtn.addEventListener('click', () => this.toggleEditMode(false));
        this.elements.copyBtn.addEventListener('click', () => this.copyShareLink());
        this.elements.noteContent.addEventListener('input', () => this.updatePreview());
    }

    createNewNote() {
        const note = {
            id: Date.now(),
            title: '新筆記',
            content: '',
            created: new Date().toISOString()
        };
        this.notes.push(note);
        this.saveNotes();
        this.renderNotesList();
        this.loadNote(note.id);
    }

    saveCurrentNote() {
        if (this.currentNoteId === null) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            note.title = this.elements.noteTitle.value;
            note.content = this.elements.noteContent.value;
            this.saveNotes();
            this.renderNotesList();
        }
    }

    shareNote() {
        if (this.currentNoteId === null) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            const shareData = {
                title: note.title,
                content: note.content
            };
            const shareString = btoa(JSON.stringify(shareData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?note=${shareString}`;
            this.elements.shareLink.value = shareUrl;
            this.elements.shareModal.show();
        }
    }

    copyShareLink() {
        this.elements.shareLink.select();
        document.execCommand('copy');
        this.elements.copyBtn.textContent = '已複製！';
        setTimeout(() => {
            this.elements.copyBtn.textContent = '複製';
        }, 2000);
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            this.currentNoteId = id;
            this.elements.noteTitle.value = note.title;
            this.elements.noteContent.value = note.content;
            this.updatePreview();
            
            // 更新選中狀態
            this.elements.notesList.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.toggle('active', parseInt(item.dataset.id) === id);
            });
        }
    }

    toggleEditMode(isEdit) {
        this.elements.editBtn.classList.toggle('active', isEdit);
        this.elements.previewBtn.classList.toggle('active', !isEdit);
        this.elements.editorArea.classList.toggle('d-none', !isEdit);
        this.elements.previewArea.classList.toggle('d-none', isEdit);
        if (!isEdit) {
            this.updatePreview();
        }
    }

    updatePreview() {
        const content = this.elements.noteContent.value;
        this.elements.previewArea.innerHTML = marked(content);
    }

    renderNotesList() {
        this.elements.notesList.innerHTML = this.notes
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .map(note => `
                <button class="list-group-item list-group-item-action ${note.id === this.currentNoteId ? 'active' : ''}" 
                        data-id="${note.id}">
                    ${note.title}
                </button>
            `)
            .join('');

        this.elements.notesList.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', () => this.loadNote(parseInt(item.dataset.id)));
        });
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    window.noteApp = new NoteApp();
});