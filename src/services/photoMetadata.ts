// ============================================================
// OshiQuest — 写真メタデータ抽出サービス
// ============================================================
// カメラロールから選択された写真のEXIFデータ（日時、GPS）を
// 抽出し、逆ジオコーディングで場所名を取得する。
// ============================================================

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { PhotoMetadata } from '../types';

/**
 * 画像EXIFの日時文字列をDateオブジェクトに変換
 * EXIF日時形式: "2025:12:25 14:30:00"
 */
function parseExifDateTime(exifDate: string | undefined): Date | null {
    if (!exifDate) return null;

    try {
        // EXIF format: "YYYY:MM:DD HH:MM:SS"
        const normalized = exifDate.replace(
            /^(\d{4}):(\d{2}):(\d{2})/,
            '$1-$2-$3'
        );
        const date = new Date(normalized);
        return isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

/**
 * GPS DMS (度分秒) 形式を十進数度に変換
 */
function convertDMSToDecimal(
    dms: any,
    ref: string | undefined
): number | null {
    if (typeof dms === 'number') {
        let decimal = dms;
        if ((ref === 'S' || ref === 'W') && decimal > 0) {
            decimal = -decimal;
        }
        return decimal;
    }

    if (!Array.isArray(dms) || dms.length < 3 || !ref) return null;

    const [degrees, minutes, seconds] = dms;
    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (ref === 'S' || ref === 'W') {
        decimal = -decimal;
    }

    return decimal;
}

/**
 * GPS座標から住所/場所名を取得（逆ジオコーディング）
 */
async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<string | null> {
    try {
        const results = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
        });

        if (results.length === 0) return null;

        const place = results[0];
        const parts: string[] = [];

        // 日本語の住所順序: 都道府県 → 市区町村 → 地域名
        if (place.region) parts.push(place.region);
        if (place.city) parts.push(place.city);
        if (place.district) parts.push(place.district);
        if (place.street) parts.push(place.street);
        if (place.name && place.name !== place.street) parts.push(place.name);

        return parts.length > 0 ? parts.join(' ') : null;
    } catch (error) {
        console.warn('[PhotoMetadata] Reverse geocoding failed:', error);
        return null;
    }
}

/**
 * カメラロールから写真を選択し、メタデータを抽出する
 *
 * @param allowMultiple - 複数枚選択を許可するか（デフォルト: true）
 * @returns 選択された写真のメタデータ配列。キャンセル時は空配列。
 */
export async function pickPhotosWithMetadata(
    allowMultiple: boolean = true
): Promise<PhotoMetadata[]> {
    // カメラロールへのアクセス許可を確認
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error(
            'カメラロールへのアクセスが許可されていません。設定からアクセスを許可してください。'
        );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: allowMultiple,
        quality: 0.8,
        exif: true, // EXIFデータを取得
    });

    if (result.canceled || !result.assets) {
        return [];
    }

    const metadataPromises = result.assets.map((asset) =>
        extractMetadata(asset)
    );

    return Promise.all(metadataPromises);
}

/**
 * ImagePickerアセットからPhotoMetadataを構築
 */
async function extractMetadata(
    asset: ImagePicker.ImagePickerAsset
): Promise<PhotoMetadata> {
    const exif = asset.exif;

    // EXIF日時の抽出
    const dateTime = parseExifDateTime(
        exif?.DateTimeOriginal ?? exif?.DateTime
    );

    // GPS座標の抽出
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (exif?.GPSLatitude && exif?.GPSLongitude) {
        latitude = convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
        longitude = convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
    }

    // 逆ジオコーディングで場所名を取得
    let locationName: string | null = null;
    if (latitude !== null && longitude !== null) {
        locationName = await reverseGeocode(latitude, longitude);
    }

    return {
        dateTime,
        latitude,
        longitude,
        locationName,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
    };
}

/**
 * 複数の写真メタデータから最適な代表データを選択
 * （最も古い日時、最初の位置情報を優先）
 */
export function mergePhotoMetadata(
    photos: PhotoMetadata[]
): Pick<
    PhotoMetadata,
    'dateTime' | 'latitude' | 'longitude' | 'locationName'
> {
    if (photos.length === 0) {
        return {
            dateTime: null,
            latitude: null,
            longitude: null,
            locationName: null,
        };
    }

    // 最も古い日時を採用
    const withDates = photos.filter((p) => p.dateTime !== null);
    const dateTime =
        withDates.length > 0
            ? withDates.sort(
                (a, b) => a.dateTime!.getTime() - b.dateTime!.getTime()
            )[0].dateTime
            : null;

    // 最初に見つかったGPS情報を採用
    const withLocation = photos.find(
        (p) => p.latitude !== null && p.longitude !== null
    );

    return {
        dateTime,
        latitude: withLocation?.latitude ?? null,
        longitude: withLocation?.longitude ?? null,
        locationName: withLocation?.locationName ?? null,
    };
}
