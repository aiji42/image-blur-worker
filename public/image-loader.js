document.querySelectorAll('img[data-src]').forEach((img) => {
	const loadHighQuality = () => {
		img.removeEventListener('load', loadHighQuality);

		const highQualitySrc = img.dataset.src;
		const highQualityImg = new Image();
		highQualityImg.onload = () => {
			img.style.filter = 'blur(10px)';

			setTimeout(() => {
				img.style.transition = 'filter 0.2s ease-out';
				img.src = highQualitySrc;
				img.style.filter = 'blur(0)';
			}, 50);
		};
		highQualityImg.src = highQualitySrc;
	};

	if (img.complete) {
		loadHighQuality();
	} else {
		img.addEventListener('load', loadHighQuality);
	}
});
