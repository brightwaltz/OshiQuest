// ============================================================
// OshiQuest — マネタイズサービス（広告・課金）
// ============================================================

import { Platform } from 'react-native';
import mobileAds, {
    MaxAdContentRating,
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';
import * as RNIap from 'react-native-iap';
import { supabase } from './supabase';
import { grantAdRewardItem } from './itemDrop';
import type { ItemDropResult } from '../types';

// ---- 広告基盤 (AdMob) ----

const adUnitId = __DEV__
    ? TestIds.REWARDED
    : Platform.OS === 'ios'
        ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy' // TODO: iOS Ad Unit ID
        : 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // TODO: Android Ad Unit ID

let rewardedAd: RewardedAd | null = null;

export async function initializeAds() {
    await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
    });

    mobileAds()
        .initialize()
        .then(adapterStatuses => {
            console.log('AdMob initialized', adapterStatuses);
        });
}

export function loadRewardedAd(): Promise<void> {
    return new Promise((resolve, reject) => {
        rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
            unsubscribeLoaded();
            resolve();
        });

        const unsubscribeError = rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
            unsubscribeError();
            reject(error);
        });

        rewardedAd.load();
    });
}

/**
 * リワード広告を表示し、視聴完了時にアイテムを付与する
 */
export function showRewardedAdAndGrantItem(userId: string): Promise<ItemDropResult | null> {
    return new Promise((resolve, reject) => {
        if (!rewardedAd || !rewardedAd.loaded) {
            reject(new Error('広告が準備できていません'));
            return;
        }

        rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async (reward) => {
            try {
                const dropResult = await grantAdRewardItem(userId);
                resolve(dropResult);
            } catch (error) {
                reject(error);
            }
        });

        rewardedAd.addAdEventListener(RewardedAdEventType.CLOSED, () => {
            // 途中で閉じた場合または完了後に呼ばれる
            resolve(null);
        });

        rewardedAd.show();
    });
}


// ---- 課金基盤 (IAP) ----

const itemSkus = Platform.select({
    ios: [
        'com.oshiquest.app.frame.sakura',
        'com.oshiquest.app.bg.starry',
        'com.oshiquest.app.decoration.gold',
    ],
    android: [
        'com.oshiquest.app.frame.sakura',
        'com.oshiquest.app.bg.starry',
        'com.oshiquest.app.decoration.gold',
    ],
}) || [];

export async function initializeIAP() {
    try {
        await RNIap.initConnection();
        if (Platform.OS === 'android') {
            await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        }
    } catch (err) {
        console.warn('IAP Initialization error:', err);
    }
}

export async function fetchProducts() {
    try {
        const products = await RNIap.getProducts({ skus: itemSkus });
        return products;
    } catch (err) {
        console.warn('Failed to fetch products:', err);
        return [];
    }
}

export async function purchaseItem(sku: string, userId: string) {
    try {
        const result = await RNIap.requestPurchase({ sku });

        // バックエンドで検証＆付与処理
        if (result) {
            const receipt = Platform.OS === 'ios' ? result.transactionReceipt : result.purchaseToken;

            const { error } = await supabase.from('purchases').insert({
                user_id: userId,
                product_id: sku,
                platform: Platform.OS,
                receipt: receipt,
                amount_jpy: 0, // In reality, fetch from product info
                status: 'completed'
            });

            if (error) throw error;

            // レシート消費 (Android) / 完了処理 (iOS)
            if (Platform.OS === 'ios') {
                await RNIap.finishTransaction({ purchase: result, isConsumable: false });
            } else if (Platform.OS === 'android') {
                await RNIap.acknowledgePurchaseAndroid({ token: result.purchaseToken });
            }
            return true;
        }
        return false;
    } catch (err) {
        console.warn('Purchase error:', err);
        throw err;
    }
}

export async function disconnectIAP() {
    await RNIap.endConnection();
}
