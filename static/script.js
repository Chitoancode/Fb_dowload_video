// Facebook Video Downloader - Frontend JavaScript
// Made in Ceylon 🇱🇰 with ❤️ by sh13y
// Optimized and Fixed by Lê Chí Toàn

class FacebookVideoDownloader {
    constructor() {
        this.form = document.getElementById('downloadForm');
        this.loadingState = document.getElementById('loadingState');
        this.results = document.getElementById('results');
        this.errorState = document.getElementById('errorState');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        this.init();
    }
    
    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const url = document.getElementById('videoUrl').value.trim();
        const quality = document.querySelector('input[name="quality"]:checked').value;
        const currentLang = document.documentElement.lang || 'vi';
        
        if (!this.isValidFacebookUrl(url)) {
            const errorMsg = currentLang === 'vi' ? 'Vui lòng nhập đường dẫn video Facebook hợp lệ' : 'Please enter a valid Facebook video URL';
            this.showError(errorMsg);
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    quality: quality
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                const failMsg = currentLang === 'vi' ? 'Không thể phân tích video này' : 'Failed to download video';
                throw new Error(data.detail?.message || data.message || failMsg);
            }
            
            this.showResults(data);
            
        } catch (error) {
            console.error('Download error:', error);
            const fallbackMsg = currentLang === 'vi' ? 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' : 'An error occurred while processing your request';
            this.showError(error.message || fallbackMsg);
        }
    }
    
    isValidFacebookUrl(url) {
        const facebookUrlPatterns = [
            // Standard Facebook domains
            /^https?:\/\/(www\.|web\.|m\.)?facebook\.com\/.*$/,
            // Short URLs
            /^https?:\/\/fb\.watch\/.*$/
        ];
        
        return facebookUrlPatterns.some(pattern => pattern.test(url));
    }
    
    showLoading() {
        this.hideAllStates();
        const currentLang = document.documentElement.lang || 'vi';
        const loadingText = currentLang === 'vi' ? 'Đang xử lý...' : 'Processing...';
        
        this.loadingState.classList.remove('hidden');
        this.downloadBtn.disabled = true;
        this.downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
    }
    
    showResults(data) {
        this.hideAllStates();
        
        const videoInfo = document.getElementById('videoInfo');
        const downloadLink = document.getElementById('downloadLink');
        const currentLang = document.documentElement.lang || 'vi';
        
        // Nhãn đa ngôn ngữ cho bảng thông tin video
        const labels = {
            title: currentLang === 'vi' ? 'Tiêu đề:' : 'Title:',
            duration: currentLang === 'vi' ? 'Thời lượng:' : 'Duration:',
            uploader: currentLang === 'vi' ? 'Người đăng:' : 'Uploader:',
            views: currentLang === 'vi' ? 'Lượt xem:' : 'Views:'
        };
        
        // Đổ dữ liệu thông tin video đã phân tích
        videoInfo.innerHTML = `
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${labels.title}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 break-words">${this.escapeHtml(data.video_info.title || 'N/A')}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${labels.duration}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${this.formatDuration(data.video_info.duration)}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${labels.uploader}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${this.escapeHtml(data.video_info.uploader || 'N/A')}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${labels.views}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${this.formatNumber(data.video_info.view_count)}</p>
                </div>
            </div>
        `;
        
        // Thiết lập endpoint luồng tải tệp tin
        const videoId = this.generateVideoId(data.video_info.title);
        const streamUrl = `/stream/${videoId}?url=${encodeURIComponent(data.download_url)}`;
        const fileName = this.generateFileName(data.video_info.title);
        
        downloadLink.href = streamUrl;
        downloadLink.download = fileName;
        
        // Xử lý sự kiện tải xuống, tương thích hoàn toàn cấu trúc HTML mới
        downloadLink.onclick = (e) => {
            e.preventDefault();
            
            const downloadText = document.getElementById('downloadText');
            const downloadIcon = document.getElementById('downloadIcon');
            
            // Cập nhật trạng thái đang tải xuống
            if (downloadIcon) downloadIcon.className = "fas fa-spinner fa-spin mr-2 text-white";
            if (downloadText) downloadText.textContent = currentLang === 'vi' ? "Đang tải xuống..." : "Downloading...";
            downloadLink.style.pointerEvents = 'none';
            
            const downloadWindow = window.open(streamUrl, '_blank');
            
            setTimeout(() => {
                // Khôi phục trạng thái nút bấm ban đầu sau 2 giây
                if (downloadIcon) downloadIcon.className = "fas fa-download mr-2 text-white";
                if (downloadText) {
                    downloadText.textContent = currentLang === 'vi' ? "Tải Xuống Ngay Bây Giờ" : "Download Now";
                }
                downloadLink.style.pointerEvents = '';
                if (downloadWindow) {
                    downloadWindow.close();
                }
            }, 2000);
            
            return false;
        };
        
        this.results.classList.remove('hidden');
        this.resetButton();
    }
    
    showError(message) {
        this.hideAllStates();
        document.getElementById('errorMessage').textContent = message;
        this.errorState.classList.remove('hidden');
        this.resetButton();
    }
    
    hideAllStates() {
        this.loadingState.classList.add('hidden');
        this.results.classList.add('hidden');
        this.errorState.classList.add('hidden');
    }
    
    resetButton() {
        const currentLang = document.documentElement.lang || 'vi';
        const btnText = currentLang === 'vi' ? 'Bắt Đầu Phân Tích Video' : 'Download Video';
        
        this.downloadBtn.disabled = false;
        this.downloadBtn.innerHTML = `<i class="fas fa-arrow-down-long animate-bounce mr-2"></i>${btnText}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDuration(seconds) {
        if (!seconds) return 'N/A';
        const currentLang = document.documentElement.lang || 'vi';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        const unit = {
            hours: currentLang === 'vi' ? ' Giờ' : ' Hours',
            mins: currentLang === 'vi' ? ' Phút' : ' Min',
            secs: currentLang === 'vi' ? ' Giây' : ' Sec'
        };
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}${unit.hours}`;
        } else if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}${unit.mins}`;
        } else {
            return `${remainingSeconds}${unit.secs}`;
        }
    }
    
    formatNumber(num) {
        if (!num) return 'N/A';
        return num.toLocaleString();
    }
    
    generateFileName(title) {
        if (!title) return 'facebook_video.mp4';
        
        const cleanTitle = title
            .replace(/[^\w\s-]/g, '') 
            .replace(/\s+/g, '_') 
            .substring(0, 50); 
            
        return `${cleanTitle}.mp4`;
    }
    
    generateVideoId(title) {
        if (!title) return 'facebook_video';
        
        return title
            .replace(/[^\w\s-]/g, '') 
            .replace(/\s+/g, '_') 
            .toLowerCase()
            .substring(0, 30); 
    }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new FacebookVideoDownloader();
});

// Thêm các hiệu ứng bổ trợ giao diện người dùng
document.addEventListener('DOMContentLoaded', () => {
    // Cuộn mượt cho các liên kết nội bộ
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Kiểm tra và phản hồi trạng thái hợp lệ của URL đầu vào trực tiếp
    const urlInput = document.getElementById('videoUrl');
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            const url = this.value.trim();
            const isValid = url === '' || /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)/.test(url);
            
            this.classList.toggle('border-red-300', !isValid && url !== '');
            this.classList.toggle('border-green-300', isValid && url !== '');
        });
    }
});
