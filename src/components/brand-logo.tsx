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
    <Link href={href} className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        src="/logo.svg"
        alt="trren"
        className={`h-9 w-9 rounded-xl object-contain ring-1 ring-sky-300/30 ${iconClassName}`.trim()}
      />
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-sm font-bold tracking-tight text-white ${textClassName}`.trim()}>trren</span>
        {showTagline ? (
          <span className="block truncate text-[10px] text-zinc-400">the sound of conversations.</span>
        ) : null}
      </span>
    </Link>
  )
}
