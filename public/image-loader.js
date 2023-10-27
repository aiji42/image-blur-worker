document.querySelectorAll('img[data-src]').forEach((img) => {
	img.addEventListener('load', () => {
		const highQualitySrc = img.dataset.src;
		const highQualityImg = new Image();
		highQualityImg.onload = () => {
			img.src = highQualitySrc;
		};
		highQualityImg.src = highQualitySrc;
	});
});
