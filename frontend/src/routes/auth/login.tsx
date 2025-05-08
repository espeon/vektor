import LogIn from '@/components/auth/LogIn';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative flex flex-col gap-4 items-center justify-center min-h-screen">
      <LogIn />
      <div className="flex flex-row gap-2 z-10">
        <img src="/88x31/bsky.png" alt="WorksWithBsky Logo" />
        <img src="/88x31/archlinux.gif" alt="archlinux" />
        <img src="/88x31/atprotonow.gif" alt="atproto" />
        <img src="/88x31/jjj-now.gif" alt="js-warning" />
        <img src="/88x31/yandex.gif" alt="yandex" />
        <img
          src="/88x31/zune.png"
          alt="zune"
          className="border border-border"
        />
      </div>
    </div>
  );
}
