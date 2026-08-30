import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  id: {
    translation: {
      common: {
        appName: 'COREÉATERY',
        loading: 'Memuat...',
        error: 'Terjadi kesalahan.',
        retry: 'Coba lagi',
        empty: 'Belum ada data.',
      },
      nav: {
        home: 'Beranda',
        menu: 'Menu',
        reservation: 'Reservasi',
        gallery: 'Galeri',
      },
    },
  },
  en: {
    translation: {
      common: {
        appName: 'COREÉATERY',
        loading: 'Loading...',
        error: 'Something went wrong.',
        retry: 'Try again',
        empty: 'No data available.',
      },
      nav: {
        home: 'Home',
        menu: 'Menu',
        reservation: 'Reservation',
        gallery: 'Gallery',
      },
    },
  },
  zh: {
    translation: {
      common: {
        appName: 'COREÉATERY',
        loading: '加载中...',
        error: '发生错误。',
        retry: '重试',
        empty: '暂无数据。',
      },
      nav: {
        home: '首页',
        menu: '菜单',
        reservation: '预订',
        gallery: '画廊',
      },
    },
  },
}

const savedLanguage = localStorage.getItem('coreeatery-language')

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'id',
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (language) => {
  localStorage.setItem('coreeatery-language', language)
})

export default i18n
