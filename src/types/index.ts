/** 商品発売情報のステータス */
export type FigureStatus = 'upcoming' | 'preorder' | 'released'

export const FIGURE_STATUS_LABELS: Record<FigureStatus, string> = {
  upcoming: '発売前',
  preorder: '予約中',
  released: '発売済み',
}

/** 商品発売情報 */
export interface Figure {
  id: string
  name: string
  manufacturer: string
  series: string
  /** YYYY-MM-DD */
  releaseDate: string
  /** 定価（円） */
  price: number | null
  scale: string
  imageUrl: string
  status: FigureStatus
  createdAt: string
}

/** 購入予定のステータス */
export type PurchaseStatus = 'wanted' | 'preordered' | 'purchased' | 'skipped'

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  wanted: '欲しい',
  preordered: '予約済み',
  purchased: '購入済み',
  skipped: '見送り',
}

/** 購入予定 */
export interface PurchasePlan {
  id: string
  /** 商品発売情報との紐付け（任意） */
  figureId: string | null
  /** 紐付けなしの場合の商品名 */
  name: string
  status: PurchaseStatus
  /** YYYY-MM-DD */
  purchaseDate: string
  /** 購入価格（円） */
  purchasePrice: number | null
  /** 購入場所（店舗名/URL） */
  purchasePlace: string
  memo: string
  createdAt: string
}

/** 好きな作品ジャンル */
export type WorkType = 'anime' | 'manga' | 'game' | 'other'

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  anime: 'アニメ',
  manga: '漫画',
  game: 'ゲーム',
  other: 'その他',
}

/** 好きな作品（フィギュア検索のベースになる） */
export interface FavoriteWork {
  id: string
  title: string
  type: WorkType
  createdAt: string
}

/** 好きな商品シリーズ */
export interface FavoriteSeries {
  id: string
  name: string
  createdAt: string
}

/** AmiAmi API のレスポンス商品アイテム */
export interface AmiAmiItem {
  gcode: string
  gname: string
  maker_name?: string
  sname?: string
  releasedate?: string
  min_price?: number
  thumb_url?: string
}
