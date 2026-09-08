import AppProvidersWrapper from "@/components/wrappers/AppProvidersWrapper";
import { DEFAULT_PAGE_TITLE } from "@/context/constants";
import { getBusinessSetting } from '@/app/actions/settings';
import 'flatpickr/dist/flatpickr.min.css';
import '@/assets/scss/app.scss';
export async function generateMetadata() {
  let iconUrl = '/favicon.ico';
  try {
    const { data } = await getBusinessSetting();
    if (data?.iconUrl) iconUrl = data.iconUrl;
  } catch (error) {
    console.error('Failed to load business settings for metadata', error);
  }

  return {
    title: {
      template: `%s | Hosting Space India`,
      default: DEFAULT_PAGE_TITLE
    },
    description: 'Hosting Space India Client Portal',
    icons: {
      icon: iconUrl
    }
  };
}
export default function RootLayout({
  children
}) {
  return <html lang="en">
            <body className={``}>
                <AppProvidersWrapper>{children}</AppProvidersWrapper>
            </body>
        </html>;
}