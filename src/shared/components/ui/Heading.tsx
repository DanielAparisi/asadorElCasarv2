import { Tag } from './Tag'

export function Heading({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h2
      className={`m-0 font-title font-normal uppercase text-ink tracking-[0.01em] ${className}`}
    >
      {children}
    </h2>
  )
}

/** Centred section header: a tag sitting above the big heading. */
export function SectionHeading({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="flex flex-col items-center mb-8.5 max-[900px]:mb-7">
      <Tag>{tag}</Tag>
      <Heading className="mt-3.5 text-[5.5rem] leading-[0.92] tracking-[0.02em] max-[900px]:text-[3.5rem] max-[560px]:text-[3rem]">
        {title}
      </Heading>
    </div>
  )
}
