const { AndroidConfig, withAndroidStyles } = require("expo/config-plugins");

// AppTheme sem android:windowBackground herda o branco padrão do
// Theme.AppCompat.DayNight. Qualquer frame perdido no cold start (splash
// nativo -> conteúdo RN) expõe esse branco em vez da cor da marca -
// investigado via adb/logcat.
const WINDOW_BACKGROUND_COLOR = "@color/splashscreen_background";

const withAndroidSplashWindowBackground = config =>
	withAndroidStyles(config, config => {
		config.modResults = AndroidConfig.Styles.setStylesItem({
			xml: config.modResults,
			parent: AndroidConfig.Styles.getAppThemeGroup(),
			item: {
				$: { name: "android:windowBackground" },
				_: WINDOW_BACKGROUND_COLOR,
			},
		});
		return config;
	});

module.exports = withAndroidSplashWindowBackground;
