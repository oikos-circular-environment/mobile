import * as Application from "expo-application";
import * as Device from "expo-device";
import { Dimensions, Platform } from "react-native";
import { getSupportDeviceInfo } from "@/libs/moderation/device-info";

type Mutable = Record<string, unknown>;

describe("getSupportDeviceInfo", () => {
	const originalOS = Platform.OS;
	const originalAppVersion = Application.nativeApplicationVersion;
	const originalOsVersion = Device.osVersion;
	const dimensionsSpy = jest.spyOn(Dimensions, "get");
	const defaultWindowDimensions = {
		width: 800,
		height: 1200,
		scale: 2,
		fontScale: 1,
	};

	beforeEach(() => {
		dimensionsSpy.mockReturnValue(defaultWindowDimensions);
	});

	afterEach(() => {
		Object.defineProperty(Platform, "OS", {
			value: originalOS,
			configurable: true,
		});
		(Application as unknown as Mutable).nativeApplicationVersion =
			originalAppVersion;
		(Device as unknown as Mutable).osVersion = originalOsVersion;
	});

	afterAll(() => {
		dimensionsSpy.mockRestore();
	});

	it.each([
		["ios", "ios"],
		["android", "android"],
		["windows", "web"],
		["macos", "web"],
	])("resolves Platform.OS %s to platform %s", (os, expected) => {
		Object.defineProperty(Platform, "OS", { value: os, configurable: true });
		expect(getSupportDeviceInfo().platform).toBe(expected);
	});

	it("passes through app_version and os_version when available", () => {
		(Application as unknown as Mutable).nativeApplicationVersion = "1.2.3";
		(Device as unknown as Mutable).osVersion = "16.4";

		const info = getSupportDeviceInfo();

		expect(info.app_version).toBe("1.2.3");
		expect(info.os_version).toBe("16.4");
	});

	it("falls back to 0.0.0 app_version and undefined os_version when native values are null", () => {
		(Application as unknown as Mutable).nativeApplicationVersion = null;
		(Device as unknown as Mutable).osVersion = null;

		const info = getSupportDeviceInfo();

		expect(info.app_version).toBe("0.0.0");
		expect(info.os_version).toBeUndefined();
	});

	it.each([
		[320, "SMALL"],
		[359, "SMALL"],
		[360, "MEDIUM"],
		[599, "MEDIUM"],
		[600, "LARGE"],
		[1024, "LARGE"],
	])("buckets window width %d as %s", (width, expected) => {
		dimensionsSpy.mockReturnValue({
			width,
			height: 800,
			scale: 2,
			fontScale: 1,
		});

		expect(getSupportDeviceInfo().screen_size).toBe(expected);
	});
});
