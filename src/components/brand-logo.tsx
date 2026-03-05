import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  showTagline?: boolean
  className?: string
  textClassName?: string
  iconClassName?: string
}

export function BrandLogo({
  href = '/',
  showTagline = false,
  className = '',
  textClassName = '',
  iconClassName = '',
}: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-3 ${className}`.trim()} aria-label="trren home">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/35 bg-gradient-to-br from-blue-800/70 to-blue-950/80 shadow-[0_8px_20px_rgba(3,12,37,0.45)]">
        <img
          src="/logo.svg"
          alt="trren"
          className={`h-8 w-8 rounded-lg object-contain ${iconClassName}`.trim()}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-sm font-bold tracking-tight text-white ${textClassName}`.trim()}>trren</span>
        {showTagline ? (
          <span className="hidden truncate text-[10px] text-zinc-400 sm:block">the sound of conversations.</span>
        ) : null}
      </span>
    </Link>
  )
}
