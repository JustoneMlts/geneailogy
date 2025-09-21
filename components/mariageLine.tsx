import { MemberType } from "@/lib/firebase/models"

export const MariageLines = ({
    members,
    cardRefs
}: {
    members: MemberType[]
    cardRefs: React.RefObject<(HTMLDivElement | null)[]>
}) => {
    if (!cardRefs.current) return null

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {members.map((member, idx) => {
                if (!member.isMarried || !member.mariageId) return null
                const spouseIdx = members.findIndex(m => m.id === member.mariageId)
                if (spouseIdx === -1) return null

                const memberEl = cardRefs.current[idx]
                const spouseEl = cardRefs.current[spouseIdx]
                if (!memberEl || !spouseEl) return null

                const memberRect = memberEl.getBoundingClientRect()
                const spouseRect = spouseEl.getBoundingClientRect()
                const parentRect = memberEl.parentElement!.getBoundingClientRect()

                const x1 = memberRect.left + memberRect.width / 2 - parentRect.left
                const x2 = spouseRect.left + spouseRect.width / 2 - parentRect.left
                const y = memberRect.top + memberRect.height - parentRect.top + 4

                return (
                    <line
                        key={member.id + "_marriage"}
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke="red"
                        strokeWidth={2}
                    />
                )
            })}
        </svg>
    )
}
