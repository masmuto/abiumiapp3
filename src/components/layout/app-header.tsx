// Header: logo + nama pengguna aktif + tombol ganti user
'use client';
import { useSession } from "@/lib/session-store";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { colorClass } from "@/lib/format";
import { MONTHS_ID } from "@/lib/constants";

export function AppHeader({
  month,
  year,
  onChangePeriod,
}: {
  month: number;
  year: number;
  onChangePeriod?: (m: number, y: number) => void;
}) {
  const { user, logout } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-emerald-100 dark:border-emerald-900/30">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">Keuangan Keluarga</div>
            <div className="text-xs text-muted-foreground truncate">
              {MONTHS_ID[month - 1]} {year}
            </div>
          </div>
        </div>

        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2">
            {/* Pilih bulan (desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  {MONTHS_ID[month - 1].slice(0, 3)} {year}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Pilih Bulan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MONTHS_ID.map((m, i) => (
                  <DropdownMenuItem
                    key={m}
                    onClick={() => onChangePeriod?.(i + 1, year)}
                  >
                    {m}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tahun</DropdownMenuLabel>
                {[-1, 0, 1].map((offset) => {
                  const y = new Date().getFullYear() + offset;
                  return (
                    <DropdownMenuItem
                      key={y}
                      onClick={() => onChangePeriod?.(month, y)}
                    >
                      {y}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User info */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pl-1 pr-2"
                >
                  <span
                    className={`w-7 h-7 rounded-full ${colorClass(user.color).bg} flex items-center justify-center text-xs font-bold ${colorClass(user.color).text}`}
                  >
                    {user.name.charAt(0)}
                  </span>
                  <span className="hidden sm:inline">{user.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  Sedang mencatat sebagai
                </DropdownMenuLabel>
                <DropdownMenuItem className="font-bold">
                  {user.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Ganti pengguna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
