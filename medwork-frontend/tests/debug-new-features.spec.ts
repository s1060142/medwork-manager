import { test, expect } from '@playwright/test'

test('debug: full stepper workflow with new features (correct markers)', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message))

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Login
  await page.locator('input[type="text"]').fill('doctor')
  await page.locator('input[type="password"]').fill('Doctor123!')
  await page.getByRole('button', { name: 'Accedi' }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Open full stepper
  await page.getByRole('button', { name: 'Il Mio Giorno' }).click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Nuova Visita (Step)' }).click()
  await page.waitForTimeout(1500)

  // 1. Worker selection
  const workerCombo = page.getByRole('combobox', { name: /Lavoratore in Visita/i }).first()
  await workerCombo.waitFor({ state: 'visible', timeout: 5000 })
  await workerCombo.click()
  await page.waitForTimeout(800)
  const option = page.locator('[role="option"]').filter({ hasText: /— CF:/i }).first()
  await option.waitFor({ state: 'visible', timeout: 5000 })
  console.log('WORKER OPTION:', (await option.textContent() || '').trim().slice(0, 80))
  await option.click()
  await page.waitForTimeout(1500)
  console.log('WORKER SELECTED: label now =', (await workerCombo.textContent() || '').trim().slice(0, 80))

  // 2. Apply standard check
  const applyBtn = page.getByRole('button', { name: /Applica check standard/i }).first()
  if (await applyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await applyBtn.click()
    await page.waitForTimeout(1000)
    const afterApply = await page.locator('body').innerText()
    console.log('APPLIED standard check: OK; checkmarks shown:', (afterApply.match(/✓/g) || []).length)
  } else {
    console.log('APPLIED standard check: BUTTON NOT VISIBLE')
  }

  // 3. Advance to step 2 (activeStep===1: "Esame Obiettivo & Parametri Vitali")
  const nextBtn = page.getByRole('button', { name: 'Avanti', exact: true }).first()
  const avantiCount = await page.getByRole('button', { name: 'Avanti' }).count()
  console.log('AVANTI BUTTON COUNT:', avantiCount)
  for (let i = 0; i < avantiCount; i++) {
    const cls = await page.getByRole('button', { name: 'Avanti' }).nth(i).getAttribute('class')
    const visible = await page.getByRole('button', { name: 'Avanti' }).nth(i).isVisible().catch(() => false)
    console.log(`  avanti[${i}] visible=${visible} class=(contained?${(cls||'').includes('MuiButton-contained')}) disabledAttr=${(cls||'').includes('Mui-disabled')}`)
  }
  console.log('AVANTI enabled:', await nextBtn.isEnabled().catch(() => false))
  if (await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
    await nextBtn.click()
    await page.waitForTimeout(1500)
    const errAlert = await page.locator('.MuiAlert-error, .MuiAlert-warning').allInnerTexts().catch(() => [] as string[])
    console.log('VALIDATION ALERTS:', JSON.stringify(errAlert))
    const stepStates = await page.evaluate(() => {
      const steps = Array.from(document.querySelectorAll('.MuiStep-root'))
      return steps.map((s) => ({
        label: (s.querySelector('.MuiStepLabel-root')?.textContent || '').trim().slice(0, 40),
        current: s.getAttribute('aria-current') || (s.querySelector('[aria-current]')?.getAttribute('aria-current')) || 'none',
      }))
    })
    console.log('STEP STATES:', JSON.stringify(stepStates))
    const bodyText2 = await page.locator('body').innerText()
    // Which step's content is actually visible?
    const diag = await page.evaluate(() => {
      const has = (sel) => !!document.querySelector(sel)
      const t = document.body.innerText
      return {
        activeStepLabel: (document.querySelector('.Mui-active .MuiStepLabel-root')?.textContent || document.querySelector('[class*=MuiStepLabel-] .Mui-active')?.textContent || 'N/A').trim().slice(0, 40),
        stepLabelClasses: Array.from(document.querySelectorAll('.MuiStepLabel-root')).map((el) => el.className.split(' ').filter((c) => c.startsWith('Mui-')).join(',')),
        anamnesiStillVisible: t.includes('Checklist Anamnestica'),
        targetOrgansFieldVisible: t.includes('organi bersaglio') || t.includes('Organi bersaglio'),
        stepLabelActiveCount: document.querySelectorAll('.Mui-active').length,
      }
    })
    console.log('DIAG AFTER AVANTI:', JSON.stringify(diag))
        console.log('STEP2 — has Accertamenti Strumentali card:', /Accertamenti Strumentali & Diagnostici/i.test(bodyText2))
    console.log('STEP2 — modules:', ['Visiotest', 'Audiometria', 'Spirometria', 'Drug Test'].map((k) => k + '=' + bodyText2.includes(k)).join(' '))
    console.log('STEP2 — has preset button Tutti nella Norma:', /Tutti nella Norma/.test(bodyText2))
    const presetBtn = page.getByRole('button', { name: /Tutti nella Norma/i }).first()
    if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await presetBtn.click()
      await page.waitForTimeout(800)
      console.log('PRESET 1-click: OK')
      const visusOD = await page.getByLabel('Visus OD').inputValue().catch(() => 'N/A')
      console.log('PRESET verify — Visus OD field value:', visusOD)
    } else {
      console.log('PRESET button not visible')
    }
  } else {
    console.log('STEP2: cannot advance (Avanti disabled)')
  }

  // 4. Open WorkerClinicalDrawer (Fascicolo Storico Lavoratore) if enabled
  const drawerTrigger = page.getByRole('button', { name: /Fascicolo Storico Lavoratore/i }).first()
  const drawerEnabled = await drawerTrigger.isEnabled().catch(() => false)
  console.log('DRAWER button enabled:', drawerEnabled)
  if (drawerEnabled) {
    await drawerTrigger.click()
    await page.waitForTimeout(1500)
    const bodyText3 = await page.locator('body').innerText()
    console.log('DRAWER — opened (shows Anagrafica/Cartella/Storico):', /Anagrafica|Fascicolo|Storico|Esami/i.test(bodyText3))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  } else {
    console.log('DRAWER trigger DISABLED (needs worker selected)')
  }

  console.log('CONSOLE ERRORS (' + consoleErrors.length + '):')
  consoleErrors.slice(0, 10).forEach((e) => console.log('  -', e.slice(0, 300)))
})
