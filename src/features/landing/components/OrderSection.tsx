import { ORDER_STEPS, PHONE_HREF, PHONE_NUMBER, WHATSAPP_URL } from '../content'
import { BUTTON_ON_INK, Button } from '@/shared/components/ui/Button'
import { Lead } from '@/shared/components/ui/Lead'
import { Tag } from '@/shared/components/ui/Tag'

/**
 * Orders and bookings: the ink block, with the two contact buttons on the left
 * and the three numbered steps on the right.
 */
function OrderSection() {
  return (
    <section
      id="reservas"
      className="grid grid-cols-2 gap-14 items-center mt-18 px-11.5 py-13 bg-ink scroll-mt-6
        max-[900px]:grid-cols-1 max-[900px]:mt-13 max-[900px]:px-7 max-[900px]:py-9"
    >
      <div className="flex flex-col gap-5">
        <div>
          <Tag red>Reservas y pedidos</Tag>
        </div>

        <h2 className="m-0 font-title font-normal uppercase tracking-[0.01em] text-bg text-[4.25rem] leading-[0.9] max-[900px]:text-[2.75rem] max-[560px]:text-[2.375rem]">
          Encarga tu pollo
        </h2>

        <Lead inverted>
          Haz tu pedido por WhatsApp o por teléfono y te decimos la hora de recogida. Para fines de
          semana y festivos, mejor con un día de antelación: la parrilla se llena pronto.
        </Lead>

        <div className="flex gap-4 flex-wrap mt-2">
          <Button
            variant="red"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={BUTTON_ON_INK}
          >
            Pedir por WhatsApp
          </Button>
          <Button variant="ghost" href={PHONE_HREF}>
            Llamar · {PHONE_NUMBER}
          </Button>
        </div>
      </div>

      <ol className="m-0 p-0 list-none grid gap-5">
        {ORDER_STEPS.map((step, index) => (
          <li
            key={step.number}
            className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1 items-baseline
              ${index < ORDER_STEPS.length - 1 ? 'pb-5 border-b-2 border-line-dark' : ''}`}
          >
            <span className="row-span-2 font-title text-[2.875rem] leading-[0.9] text-red">
              {step.number}
            </span>
            <p className="m-0 font-title text-[1.375rem] tracking-[0.03em] uppercase text-bg">
              {step.title}
            </p>
            <p className="m-0 text-[0.9375rem] leading-[1.6] text-on-dark">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default OrderSection
