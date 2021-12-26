const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!
const ctx = canvas.getContext("2d")!
const img = document.querySelector<HTMLImageElement>("#img")!

const A = [
    [document.querySelector<HTMLInputElement>("#a11")!, document.querySelector<HTMLInputElement>("#a12")!],
    [document.querySelector<HTMLInputElement>("#a21")!, document.querySelector<HTMLInputElement>("#a22")!],
]

const drawLine = (p0: readonly [number, number], p1: readonly [number, number], color: string, lineWidth = 2) => {
    ctx.beginPath()
    ctx.moveTo(...p0)
    ctx.lineTo(...p1)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.closePath()
    ctx.stroke()
}

// https://stackoverflow.com/a/6333775/10710682
const drawArrow = (p0: readonly [number, number], p1: readonly [number, number]) => {
    const headlen = 10 // length of head in pixels
    const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    ctx.beginPath()
    ctx.moveTo(...p0)
    ctx.lineTo(...p1)
    ctx.lineTo(p1[0] - headlen * Math.cos(angle - Math.PI / 6), p1[1] - headlen * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(...p1)
    ctx.lineTo(p1[0] - headlen * Math.cos(angle + Math.PI / 6), p1[1] - headlen * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.stroke()
}

type Complex = { real(): number, imag(): number }
type ComplexMatrix = {
    get(i: number, j: number): Complex
}
declare const eig: any

const update = async () => {
    await eig.ready

    const w = canvas.width
    const unit = w / 2 / 5

    ctx.resetTransform()
    ctx.clearRect(0, 0, w, w)
    ctx.translate(w / 2, w / 2)

    // Grid
    for (let i = -w / 2; i < w / 2; i += unit) {
        drawLine([-w / 2, i], [w / 2, i], `rgba(0, 0, 0, 0.2)`)
        drawLine([i, -w / 2], [i, w / 2], `rgba(0, 0, 0, 0.2)`)
    }

    {
        // Image
        const t = ctx.getTransform()
        ctx.transform(+A[0][0].value, -A[1][0].value, -A[0][1].value, +A[1][1].value, 0, 0)
        ctx.drawImage(img, -50, -(100 * img.height / img.width) / 2, 100, 100 * img.height / img.width)
        ctx.setTransform(t)
    }

    // Axes
    drawLine([-w / 2, 0], [w / 2, 0], `rgba(0, 0, 0, 0.5)`)
    drawLine([0, -w / 2], [0, w / 2], `rgba(0, 0, 0, 0.5)`)

    // Eigenvectors
    // eigenvectors: 2x2, eigenvalues: 2x1
    const { eigenvectors, eigenvalues }: { eigenvectors: ComplexMatrix, eigenvalues: ComplexMatrix } = eig.Solvers.eigenSolve(eig.Matrix(A.map((row) => row.map((el) => +el.value))), /* computeEigenvectors = */ true)

    class CC {
        real: number
        imag: number
        constructor(c: Complex) {
            this.real = c.real()
            this.imag = c.imag()
        }
        toString() {
            if (this.imag === 0) { return `${Math.round(this.real * 10 ** 3) / 10 ** 3}` }
            return `${Math.round(this.real * 10 ** 3) / 10 ** 3} + ${Math.round(this.imag * 10 ** 3) / 10 ** 3} i`
        }
    }

    const eigenvectors2 = [[new CC(eigenvectors.get(0, 0)), new CC(eigenvectors.get(1, 0))], [new CC(eigenvectors.get(0, 1)), new CC(eigenvectors.get(1, 1))]]
    const eigenvalues2 = [new CC(eigenvalues.get(0, 0)), new CC(eigenvalues.get(1, 0))]
    eig.GC.flush()

    document.querySelector<HTMLDivElement>("#output")!.innerText = `\
            eigenvectors: (${eigenvectors2[0][0]}, ${eigenvectors2[0][1]}), (${eigenvectors2[1][0]}, ${eigenvectors2[1][1]})
            eigenvalues: ${eigenvalues2[0]}, ${eigenvalues2[1]}
            `

    ctx.lineWidth = 3
    ctx.strokeStyle = `rgba(255, 0, 0, 1)`
    if (eigenvalues2[0].imag === 0 && eigenvectors2[0][0].imag === 0 && eigenvectors2[0][1].imag === 0) {
        drawArrow([0, 0], [eigenvalues2[0].real * eigenvectors2[0][0].real * unit, -eigenvalues2[0] * eigenvectors2[0][1].real * unit])
    }
    ctx.strokeStyle = `rgba(0, 0, 255, 1)`
    if (eigenvalues2[1].imag === 0 && eigenvectors2[1][0].imag === 0 && eigenvectors2[1][1].imag === 0) {
        drawArrow([0, 0], [eigenvalues2[1].real * eigenvectors2[1][0].real * unit, -eigenvalues2[1] * eigenvectors2[1][1].real * unit])
    }
}

update().catch(console.error)
img.addEventListener("load", () => { update().catch(console.error) })

for (const a_ij of A.flat()) {
    a_ij.addEventListener("input", () => {
        update().catch(console.error)
    })
}
