## Introduction

Optimal timing of nutritional support is an important but unresolved aspect of critical care. Critically ill patients typically traverse distinct metabolic phases. Initially, there is an intense catabolic “ebb” phase (first 24–48 h) characterized by tissue hypoperfusion and decreased overall metabolism, followed by a hypercatabolic “flow” phase (up to 7 days) during which significant protein degradation occurs [1, 2]. Subsequently, some patients enter a recovery/anabolic phase, while others may experience prolonged critical illness.

Both the European Society for Clinical Nutrition and Metabolism (ESPEN) and American Society for Parenteral and Enteral Nutrition (ASPEN) guidelines acknowledge these metabolic shifts and recommend strategies such as permissive underfeeding during the acute catabolic phase, with progressive advancement toward energy and protein targets by days 3–7 after ICU admission [3, 4]. However, both societies note that these recommendations are based on expert consensus and not on validated, physiology-driven criteria [3, 4].

A significant challenge to optimal nutritional provision remains- there is no single, validated clinical marker that precisely identifies the transition point from catabolism to anabolism. As a result, the optimal timing for reaching full nutritional targets is highly individualized and relies on multifactorial clinical assessment rather than a definitive “switch” [2–6].

Correctly identifying the timing of this transition is clinically crucial. Aggressive nutritional support during ongoing catabolism may worsen metabolic complications (hyperglycemia, refeeding syndrome, increased ureagenesis suggesting futile catabolism of provided proteins, telomere shortening and altered DNA methylation) and infectious complications as well as blunt beneficial autophagy and ketogenesis [7–13]. Recent large trials further suggest that higher dose or early administration of calories or protein may not improve outcomes and could be harmful in selected populations [7, 14–21]. On the other hand, delayed nutritional support after the onset of anabolism may impede recovery, muscle-mass restoration, and immune function [3–6, 13, 22].

Multiple surrogate approaches- nitrogen balance, C-reactive protein (CRP) kinetics, glucose-insulin dynamics, indirect calorimetry, as well as critical care metabolomics- have been proposed to characterize the metabolic shift [5, 23–26]. These are often constrained by technical complexity, intermittent sampling, or limited specificity, and are not routinely implemented at the bedside. Consequently, major trials and guidelines continue to rely on calendar-based criteria, rather than patient-specific-physiology, when determining nutritional targets [3, 4, 17–20, 27–29].

At the cellular level, sepsis impairs GLUT4 (Glucose Transporter Type 4) transcription and translocation, producing marked peripheral insulin resistance [30, 31]. Under these conditions, carbohydrate delivery predominantly raises circulating glucose rather than supporting muscle metabolism. These profound alterations in insulin sensitivity highlight the importance of metabolic trajectories during critical illness and suggest that dynamic glucose–insulin relationships may provide insight into the transition from catabolism to anabolism.

Observational and interventional studies highlight substantial inter-patient variability in the duration of catabolism and the optimal window for full nutritional support [7, 9, 14–19, 22, 27, 32–35], suggesting that the benefit of nutritional escalation may depend on *when* and *in whom* it is delivered. Emerging proposals and expert consensus therefore advocate for multi-parameter, trajectory-based definitions that incorporate dynamic changes in metabolic, inflammatory, and hemodynamic markers [25, 35, 36]. However, such models have not yet been systematically implemented or validated in large, real-world ICU cohorts.

To address this gap, we developed and tested a reproducible, trajectory-based model to detect the catabolic-to-anabolic transition in a large ICU cohort. The model integrates insulin resistance dynamics with hemodynamic, inflammatory, and metabolic parameters, applying predefined criteria for transition. We hypothesized that:

- 1. Earlier transition, as identified by this model, would be associated with improved 90-day mortality,
- 2. The provision of full caloric delivery before transition would be associated with increased mortality.

This framework may provide a physiology-based foundation for individualized, physiology guided nutrition strategies in critical care.

## Methods

### Study design and population

We conducted a retrospective cohort study in the general ICU at Sheba Medical Center between January 2012 and Feb. 2025. Inclusion criteria were defined a priori and consisted of adult age (18–120 years) and an ICU length of stay ≥ 48 h. Analyses were restricted to admissions with extractable insulin infusion records, as insulin infusion time-series data are required to compute the insulin resistance index. We then applied pre-specified technical exclusions for inability to apply the transition model: fewer than three glucose measurements during the ICU stay, no valid continuous insulin infusion segment data (e.g., missing start/end time or rate, or invalid timing preventing IRI computation), or missing recorded body weight. The final study cohort is shown in Fig. 1.

**Definition of catabolic-to-anabolic transition** The primary variable of interest was the physiologic shift from catabolism to anabolism. We established an operational definition using a multi-parameter, trajectory-based model that combined insulin resistance dynamics with complementary metabolic and inflammatory markers.

<figure id="fig-1">
<img src="figures/fig-1.webp" width="460" height="846" alt="Cohort Selection Process for Final Study Population" loading="lazy" decoding="async">
<figcaption><strong>Fig. 1</strong> Cohort Selection Process for Final Study Population</figcaption>
</figure>

Insulin resistance was quantified by an Insulin Resistance Index (IRI), calculated as:

IRI = [glucose *×* (insulin + 0*.*5)] *×* steroid correction factor with daily corticosteroid exposure incorporated as a hydrocortisone-equivalent adjustment. The steroid correction factors of 0.6, 0.8, 0.85 (based on hydrocortisone-equivalent dosing) were selected based on known effects of glucocorticoids on insulin resistance [37, 38] as well as extensive sensitivity and feature importance analysis (supplement 1 and 5). To avoid abrupt collapse of the IRI when insulin infusion was stopped, and to simulate a minimal basal endogenous insulin secretion [39], we added a constant of 0.5 U/h to the insulin infusion rate in the formula. Because this adjustment is a modeling assumption, we performed sensitivity analyses with alternative constants (0.1 and 1.0 U/h) and confirmed that transition rates, timing, and the association with mortality were robust to the exact value chosen.

A transition event was defined by a ≥ 30% decrease from the peak IRI, sustained below 70% of the peak for at least 24 h, allowing for brief (< 10%) rebounds. In addition, fulfillment of at least 2 of 8 physiologic criteria was required to establish transition: [1] a 30% decrease or normalization of lactate; [2] 30% reduction or cessation of norepinephrine [3], 30% reduction or cessation of adrenaline [4], 30% reduction or cessation of vasopressin; [5] a 40% decline or normalization of white blood cell count [6] a 30% decline or normalization of neutrophil percentage; [7] a 30% decrease in C-reactive protein (CRP); and [8] stabilization or increase in serum albumin. These parameters were selected a priori to capture complementary domains of recovery: (i) hemodynamic stabilization (vasopressor requirements, lactate clearance), (ii) resolution of systemic inflammation (WBC, neutrophils, CRP), (iii) attenuation of the stress response (rise or stabilization of albumin, as a negative acute-phase protein).

The selection of IRI reduction threshold, in addition to the number and thresholds of physiologic parameters, as well as use of nutrition at the denominator and the extent of steroid correction factor were informed by extensive sensitivity analyses, which demonstrated optimal outcome association strength and clinical feasibility across multiple tested configurations (Supplement 1).

### Study outcomes

The primary outcome was 90-day all-cause mortality, examined in relation to the timing of the catabolic-to-anabolic transition, which served as the main physiological exposure.

Secondary outcomes included exploratory analyses of calories delivery and overfeeding, and evaluation of the model’s robustness across heterogeneous clinical profiles. Descriptive analysis included baseline characteristics, including comorbidities, and admission SOFA score.

### Data collection

Clinical and laboratory data were obtained from a comprehensive ICU database that includes serial measurements of glucose and insulin, calories intake, vasopressor administration, inflammatory markers, serum albumin, comorbid conditions, chronic medication use, ICU length of stay, and mortality.

### Data management and validation

For each patient, a dedicated audit log tracked data completeness, transition status, and trajectories of all included physiologic parameters, including exclusion reasons and key processing steps, to ensure reproducibility and model transparency. Delivered energy was quantified as hourly total kcal/kg/h.

### Data analysis

Baseline characteristics are presented as mean ± standard deviation (SD) for continuous variables, and as counts with percentages for categorical variables.

Model robustness was examined through sensitivity analyses varying IRI thresholds, steroid correction factors, and the number of required criteria. Subgroup analyses across major clinical phenotypes (e.g., sepsis, trauma, pancreatitis) provided internal validation, and an audit log was maintained for each patient to ensure reproducibility and transparency.

To further assess the potential causal relationship between the catabolic-to-anabolic transition and clinical outcomes, causal inference analyses were conducted using doubly robust estimation methods. Propensity scores for transition were derived from logistic regression models including demographic, clinical, and biochemical covariates measured prior to the transition. These scores were incorporated into inverse probability of treatment weighting (IPTW) and augmented inverse probability weighting (AIPW) frameworks to estimate the average treatment effect (ATE) on 90-day mortality and secondary recovery endpoints. Covariate balance before and after weighting was evaluated using standardized mean differences, and sensitivity analyses explored the robustness of causal estimates to unmeasured confounding using E-values and Rosenbaum bounds.

The primary outcome, 90-day all-cause mortality, was analyzed with Kaplan–Meier survival curves stratified by transition status at predefined landmark days ([3, 5, 7], and [10]), with differences assessed by the log-rank test. Landmark Cox proportional hazards models were constructed at each time point to estimate hazard ratios (HRs) with 95% confidence intervals (CIs) for the association between transition status and mortality.

<figure class="table-figure" id="table-1">
<figcaption><strong>Table 1</strong> Baseline demographic, clinical, and comorbidity characteristics of the study cohort</figcaption>
<div class="table-scroll"><table><tr><th>Characteristic</th><th>Overall (n = 2350)</th></tr><tr><td>Age, years</td><td>59.8 ± 16.5</td></tr><tr><td>SOFA score</td><td>11.7 ± 3.9</td></tr><tr><td>Length of stay</td><td>12.6 ± 13.0</td></tr><tr><td>Sex, n (%)</td><td>Male 1431 (60.9%)</td></tr><tr class="row-group"><td>Admission diagnoses, n (%)</td><td></td></tr><tr><td>Sepsis (non-shock)</td><td>1152 (49.0%)</td></tr><tr><td>Septic shock</td><td>952 (40.5%)</td></tr><tr><td>Pneumonia</td><td>764 (32.5%)</td></tr><tr><td>Acute respiratory failure (non-pneumonia)</td><td>216 (9.2%)</td></tr><tr><td>COPD exacerbation</td><td>52 (2.2%)</td></tr><tr><td>Cardiogenic shock/Acute cardiac syndromes</td><td>436 (18.6%)</td></tr><tr><td>Renal/Metabolic</td><td>1209 (51.4%)</td></tr><tr><td>Gastrointestinal/Hepatic</td><td>474 (20.2%)</td></tr><tr><td>Neurologic diagnoses</td><td>273 (11.6%)</td></tr><tr><td>Trauma/Burns</td><td>185 (7.9%)</td></tr><tr><td>Postoperative</td><td>151 (6.4%)</td></tr><tr class="row-group"><td>Comorbidities, n (%)</td><td></td></tr><tr><td>Hypertension</td><td>873 (37.1%)</td></tr><tr><td>Hyperlipidemia</td><td>433 (18.4%)</td></tr><tr><td>Diabetes mellitus</td><td>824 (35.1%)</td></tr><tr><td>Obesity (BMI &gt; 30)</td><td>722 (30.7%)</td></tr><tr><td>Ischemic heart disease</td><td>380 (16.2%)</td></tr><tr><td>Atrial fibrillation</td><td>299 (12.7%)</td></tr><tr><td>COPD</td><td>210 (8.9%)</td></tr><tr><td>Chronic kidney disease</td><td>194 (8.3%)</td></tr><tr><td>Cirrhosis</td><td>52 (2.2%)</td></tr></table></div>
<p class="table-note">[SOFA- Sequential organ failure assessment, COPD-chronic obstructive pulmonary disease]</p>
</figure>

Multivariable models were adjusted for age, sex, baseline SOFA score, admission diagnoses, and major comorbidities. To mitigate immortal-time bias, patients who died or were censored before each landmark were excluded from the respective analysis. Changes in caloric intake before and after transition were assessed with paired and sign tests. A two-sided p value < 0.05 was considered statistically significant. Analyses were performed using Python (version 3.13.3).

### Sample size and precision

This retrospective cohort included all eligible ICU admissions; no a priori sample-size calculation was performed. We report the number at risk and the number of 90-day deaths at each landmark. At the day-3 landmark, 2,242 patients remained at risk and 848 deaths occurred within 90 days; with ~ 60% transitioned by day 3, the available number of events indicates adequate statistical information to detect moderate associations (approximately HR ≤ 0.82 or ≥ 1.22 at two-sided α = 0.05; Schoenfeld approximation).

## Results

The cohort included 2,350 ICU patients. Baseline demographics, admission diagnoses and comorbidities are detailed in Table 1. Admission diagnoses were mapped to APACHE III categories and recorded as co-existing conditions rather than a single primary diagnosis.

### Cohort and exposure definition

Of the 2,350 included patients, 2,209 (94%) fulfilled transition criteria. Most transitions occurred within the first week of ICU admission, with the distribution markedly front-loaded (peak on day 1 and a progressive decline thereafter; Fig. 2).

<figure id="fig-2">
<img src="figures/fig-2.webp" width="578" height="285" alt="Distribution of metabolic transition days in the ICU cohort" loading="lazy" decoding="async">
<figcaption><strong>Fig. 2</strong> Distribution of metabolic transition days in the ICU cohort. Histogram showing the percentages of patients achieving catabolic-to-anabolic transition on each ICU day (days 1–10, with a final bin for &gt; 10 days). Transition was defined by a ≥ 30% drop in insulin resistance index (IRI) sustained below 70% of peak for 24 h, accompanied by ≥ 2 of 8 physiologic recovery criteria (hemodynamic, inflammatory, and albumin markers). The majority of transitions occurred within the first 72 h, with a peak on day 1, and progressively fewer transitions observed thereafter</figcaption>
</figure>

### Timing of transition

Transition timing was markedly front-loaded (Fig. 2). Approximately ~ 60% of transitions occurred by day 3, with the modal day at day 1 and a progressively smaller tail thereafter; a minority occurred > 10 days after admission. This pattern indicates that, in this iteration, the catabolic → anabolic transition usually occurs early during ICU stay.

### Survival by transition status

Kaplan–Meier curves overlaid across landmarks (day 3, 5, 7, 10) showed consistent separation: at each landmark, patients who had already transitioned by the landmark had higher subsequent 90-day survival than those who had not yet transitioned. The magnitude of separation increased with later landmarks, in keeping with the growing fraction of patients who had transitioned and with the biological expectation that a sustained anabolic state associates with improved outcomes (Fig. 3A).

### Landmark Cox proportional hazards (90-day mortality)

Landmark cohorts ranged from 2,338 patients at day 1 to 2,015 at day 10, after excluding those who had died or were censored prior to each landmark. In multivariable landmark Cox models adjusted for age, sex, baseline SOFA score, admission diagnoses, and major comorbidities, metabolic transition by the respective landmark was consistently associated with lower 90-day mortality, with the magnitude of the protective association increasing at later landmarks. At day 1, no association was observed (HR 0.98, 95% CI 0.87–1.09), and a modest effect appeared at day 2 (HR 0.82, 95% CI 0.74–0.91). By day 3, transition status was associated with significantly reduced mortality (HR 0.72, 95% CI 0.65–0.81; *n* = 2,242; 848 events), with similar results at day 5 (HR 0.72, 95% CI 0.64–0.81; *n* = 2,165; 771 events). Stronger associations were seen at day 7 (HR 0.68, 95% CI 0.60–0.78; *n* = 2,094; 700 events) and day 10 (HR 0.60, 95% CI 0.51–0.72; *n* = 2,015; 621 events). Across days 1–10, the hazard ratio trajectory declined monotonically from ~ 0.98 to ~ 0.60 (Fig. 3B), indicating a progressively stronger survival advantage with earlier transition. When comparing transitioned versus non-transitioned patients overall, transition status was independently associated with improved survival, with an odds ratio for 90-day mortality of 0.57 (95% CI 0.40–0.80; *p* = 0.001). For more information – see supplement 2 and 3.

### Sensitivity to the iteration’s design choices

To evaluate the robustness of the model, we performed sensitivity analyses focusing on key design assumptions.

This iteration deliberately excluded nutrition from the IRI denominator and applied a steroid base correction of 0.6; despite these stricter assumptions, the signal was consistent (KM separation and HR < 1 from day 3 onward). Requiring ≥ 2 of 8 ancillary parameters ensured that transition calls aligned with broader clinical recovery (hemodynamics, inflammation, albumin), which likely contributed to the robustness of the association.

### Nutrition before transition, overfeeding and mortality

In adjusted analysis, patients receiving high pre-transition calories exposure (≥ 1.0 kcal/kg/h for ≥ 24 h before transition) had a significantly higher risk of death within 90 days compared with those who remained < 1.0 kcal/kg/h throughout the pre-transition phase (OR 1.25, 95% CI 1.01–1.55, *p* = 0.038). Sensitivity analyses across thresholds of 0.6, 0.8, 1.0, 1.2, and 1.4 kcal/kg/h demonstrated a consistent excess risk in the high calories group, with absolute mortality differences ranging from 7 to 9% at the lower thresholds to 14% at ≥ 1.4 kcal/kg/h, indicating a dose–response relationship (Fig. 4). For more information see supplement 4.

Across shifted cutoffs relative to the model-defined transition time (Fig. 4c), higher caloric intake before T₀ was associated with progressively greater 90-day mortality, with odds ratios exceeding 1.3 for several pre-transition windows. The association weakened after the transition, and statistical significance was reached only at the true T₀. In contrast, when using fixed calendar-day cutoffs from admission (Fig. 4d), no significant mortality difference was observed.

We also compared the calories intake at the 24 h period before versus after transition. The median intake increased slightly from 0.79 ± 0.88 to 0.88 ± 0.90 kcal/kg/h, corresponding to a mean paired change of + 0.09 ± 0.79 kcal/kg/h (95% CI 0.06–0.13), or ~ + 2.2 kcal/kg/day.

### Causal analysis

In order to estimate the potential causal effect of the catabolic-to-anabolic transition on 90-day mortality, doubly robust causal inference models were applied using inverse probability of treatment weighting (IPTW) and augmented inverse probability weighting (AIPW). After weighing, covariate balance was achieved across all major baseline characteristics (standardized mean differences < 0.05). The estimated average treatment effect (ATE) indicated a significant reduction in 90-day mortality among transitioned patients (ATE − 0.044, 95% CI − 0.065 to − 0.023, *p* < 0.001), corresponding to an absolute survival benefit of approximately 4.4%. The direction and magnitude of this causal effect were consistent across both IPTW and AIPW estimators, and sensitivity analyses suggested robustness to moderate unmeasured confounding (E-value 2.4; Rosenbaum Γ = 1.6).

<figure id="fig-3">
<img src="figures/fig-3.webp" width="578" height="726" alt="Transition versus mortality" loading="lazy" decoding="async">
<figcaption><strong>Fig. 3</strong> Transition versus mortality. <strong>a.</strong> Kaplan–Meier survival curves by transition status at multiple landmark time points. Survival probability is shown for patients stratified by whether they had achieved metabolic transition (solid lines) or not (dashed lines) by landmark days 3, 5, 7, and 10. At each landmark, patients who had transitioned exhibited consistently higher survival probabilities over the subsequent 90 days, with increasing separation of curves at later landmarks. <strong>b.</strong> Adjusted hazard ratios for 90-day mortality by transition status across landmark days. Hazard ratios (solid line, log scale) with 95% confidence intervals (shaded area) are shown for patients who achieved metabolic transition versus those who had not, at landmark days 1–10. Transition was defined by a ≥ 30% decline in insulin resistance index (IRI) with ≥ 2 physiologic recovery criteria. The protective association of transition strengthened progressively with later landmarks, with hazard ratios declining from ~ 0.98 at day 1 to ~ 0.60 by day 10, indicating lower mortality risk among patients who had transitioned.</figcaption>
</figure>

## Discussion

In this large, retrospective cohort study, we developed and preliminarily evaluated a novel, multi-parameter model to identify the metabolic transition from catabolism to anabolism in critically ill patients. Our primary finding is that an earlier transition, as defined by a sustained drop in an insulin resistance index and concurrent improvement in physiological markers, is strongly and independently associated with lower 90-day mortality. This association strengthened with increased time from ICU admission, with a hazard ratio for mortality reaching 0.60 for patients who transitioned by day 10, suggesting a potential link between sustained metabolic recovery and survival. Patients who did not achieve metabolic transition experienced substantially higher 90-day mortality, underscoring the prognostic importance of this physiological shift.

<figure id="fig-4">
<img src="figures/fig-4.webp" width="578" height="418" alt="Association Between Pre-Transition Overfeeding and 90-Day Mortality Across Caloric Thresholds" loading="lazy" decoding="async">
<figcaption><strong>Fig. 4</strong> Association Between Pre-Transition Overfeeding and 90-Day Mortality Across Caloric Thresholds. <strong>a.</strong> Ninety-day mortality by exposure group across thresholds (0.6–1.4 kcal/kg/h). Mortality rates in the High nutrition group (≥ threshold for ≥ 24 h) and Low group (&lt; threshold) are plotted for each cutoff. Mortality in the High group consistently exceeded that of the Low group, with divergence increasing at higher thresholds. <strong>b.</strong> Excess mortality (High–Low) across thresholds. Absolute mortality difference between High and Low groups, expressed as percentage points, plotted against the kcal/kg/h threshold. The mortality gap widened progressively from ~ 7–9% at 0.6–1.0 kcal/kg/h to ~ 14% at ≥ 1.4 kcal/kg/h, suggesting a dose–response relationship. <strong>c</strong>. Adjusted odds ratios (OR, 95% CI) for 90-day mortality comparing high versus low pre-transition intake when the cutoff defining the pre-transition window is shifted relative to the model-derived transition time (T₀). Mortality risk is greatest when the window precedes T₀ (negative offsets) and approaches neutrality thereafter. <strong>d.</strong> Adjusted OR (95% CI) using fixed calendar-day cutoffs from ICU admission (days 3–7) with a 1.0 kcal/kg/h threshold, showing no consistent association.</figcaption>
</figure>

Although sicker patients are expected to have higher mortality, the prognostic value of the transition model extended beyond baseline severity. Transition reflects a dynamic recovery process, not initial acuity, and the association with survival remained strong after adjustment for age, SOFA score, comorbidities, and diagnoses. Moreover, patients with similar initial metabolic derangements separated sharply by timing of transition, indicating that failure to recover—rather than baseline severity alone—drives much of the observed risk.

Transition timing showed a clear front-loaded pattern, with a greater proportion of patients transitioning earlier and progressively fewer transitioning later during the ICU course. This distribution reflects the heterogeneity of acute illness severity, the specific case mix of a given ICU, and the profound inter-patient heterogeneity in insulin resistance, inflammatory resolution, and metabolic capacity [26, 31, 32]. It also suggests that uniform calendar-based feeding strategies may not align with individual metabolic trajectories. Our findings indicate that some patients begin metabolic recovery well before the guideline-defined day 3–7 window, whereas others transition far later, highlighting limitations of a fixed-timeline approach. These results emphasize that current guidelines broad recommendations stem from the absence of validated physiologic markers [3, 4, 26, 31, 32, 36]. A transition-based framework may enable more individualized nutritional timing and dosing but requires further validation before influencing clinical practice.

The predominance of transition on day 1 suggests that for many patients, the IRI peak and early physiologic stabilization occur very rapidly after admission. This may reflect prior resuscitation in the emergency department, OR, or referring department/hospital, meaning the ICU ‘time zero’ does not always coincide with the onset of critical illness.

High pre-transition caloric exposure is independently associated with increased 90-day mortality, even after adjusting for age, SOFA score, sex, and admission diagnoses. The consistency of findings across multiple caloric thresholds, with progressively greater excess mortality at higher cutoffs, suggests a potential **dose–response** **relationship** and aligns with prior evidence that early overfeeding may be harmful [7, 17–20].

The finding that statistical significance was observed only at the model-defined transition time (T₀) supports the physiologic validity of this approach. Mortality risk from high caloric intake was greatest immediately before T₀ and diminished thereafter, indicating that the model identifies a true inflection point in metabolic recovery. In contrast, calendar-based cutoffs showed no association with outcome, emphasizing that nutritional readiness varies between patients and cannot be captured by fixed time-from-admission criteria.

Metabolic transition was not accompanied by a clinically meaningful change in caloric delivery. The median change in caloric intake across the transition window was only 2.2 kcal/kg/day, and more than half of patients experienced no change in feeding rates. This suggests the shift often occurs silently [36], unrecognized by clinicians. Importantly, this observation addresses a potential alternative explanation for our mortality findings: because caloric delivery did not systematically increase at the time patients met the transition criteria, the association between earlier transition and improved survival is unlikely to be explained simply by contemporaneous clinician-driven escalation of feeding in patients who appeared to be recovering. Rather, it highlights a potential care gap in which routine nutritional support is not dynamically adapted to the patient’s evolving metabolic state.

Taken together, the data support the hypothesis that the pre-transition metabolic state may not be suited for full caloric provision and suggest the rationale for a **restrictive feeding strategy before transition**, pending confirmation in prospective studies.

### Limitations

Several important limitations must be acknowledged. First, as an observational study, our findings demonstrate strong associations but cannot establish causality. It is plausible that the metabolic transition serves primarily as a marker of underlying recovery and is presumed as a surrogate to transition from catabolic to anabolic state.

Second, delivered kcal/kg/h may misrepresent true delivery because of interruptions, malabsorption, and unaccounted sources (e.g., propofol calories).

Third, the model was both developed and validated within a single academic medical center; generalizability to other institutions, patient populations, and clinical practices remain uncertain. External validation and complementary predictive modeling will therefore be essential.

### Future directions and implications

The present findings are hypothesis-generating and establish a foundation for future investigation. The immediate priority is prospective, multicenter validation to confirm accuracy, reproducibility, and clinical utility across diverse ICU populations. If validated, this trajectory-based model could serve as a stratification or enrichment tool for interventional trials, enabling researchers to test whether nutritional therapy titrated to an individual’s physiologic transition point-rather than an arbitrary calendar day-can improve outcomes.

## Conclusion

We developed and preliminary evaluated a novel, trajectory-based model that aims to identify a metabolic transition window in critically ill patients. In this large cohort, an earlier transition was strongly and independently associated with lower mortality risk, though this association may reflect broader recovery processes, presumed to be related to metabolic transition. Demonstrating increased mortality with overfeeding before transition emphasizes the clinical implication. This physiology-driven tool provides a preliminary, hypothesis-generating framework for future research aimed at potentially informing personalized nutritional therapy based on a patient’s evolving metabolic state.

## Supplementary Information

The online version contains supplementary material available at https://doi.or g/10.1186/s13054-026-05874-5.

<figure class="table-figure" id="table-x2">
<img src="figures/table-x2.webp" width="121" height="104" alt="Table" loading="lazy" decoding="async">

</figure>

#### Acknowledgements

Not applicable.

#### Author contributions

\*\*YG\*\* conceived and designed the study, performed substantial analysis and interpretation of the data, and was a major contributor in drafting the manuscript and substantively revising it. \*\*NL, AC, OL, DC, JK, HS, MG, SE, YH\*\*, \*\*ED\*\* were responsible for the acquisition of data and contributed to substantively revising the work. \*\*JV\*\* contributed significantly to the conception and design of the work, performed substantial analysis and interpretation of data, and participated in drafting the work and substantively revising it. \*\*DW\*\* and \*\*DS\*\* contributed to the acquisition and interpretation of nutrition-related data and substantively revised the work. \*\*TL\*\* performed substantial analysis and interpretation of data and substantively revised the work. \*\*MS\*\* contributed to the interpretation of the data and substantively revised the work. \*\*ES\*\* contributed to the conception and design of the work, interpretation of the data, and was a major contributor in substantively revising the manuscript.All authors read and approved the final manuscript.

#### Funding

Open access funding provided by Jönköping University. Data analysis validation was supported by the Sheba Hospital Research Fund.

#### Data availability

The datasets used and/or analyzed during the current study are available from the corresponding author on reasonable request.

### Declarations

#### Ethical considerations

The study was approved by the Institutional Helsinki Committee of Sheba Medical Center (file number: SMC-D-2493-25), and the requirement for informed consent was waived owing to the retrospective and anonymized nature of the data.

#### Consent to publish

Consent to Publish is waivered by the IRB committee.

#### Competing interests

The authors declare no competing interests.

#### Author details

<sup>1</sup>Departments of Anesthesiology and Intensive Care, Sheba Medical Center, Ramat Gan, Israel <sup>2</sup>Department of Nutrition, Sheba Medical Center, Ramat Gan, Israel <sup>3</sup>Department of Intensive Care, Sheba Medical Center, Ramat Gan, Israel <sup>4</sup>Departments of Nutrition and Intensive Care, Sheba Medical Center, Ramat Gan, Israel <sup>5</sup>Intensive Care Unit, Sheba Medical Center, Ramat Gan, Israel <sup>6</sup>Universidad Favaloro, Buenos Aires, Argentina <sup>7</sup>Department of Anesthesiology, Sheba Medical Center, Ramat Gan, Israel <sup>8</sup>Department of Information Systems, University of Haifa, Haifa, Israel <sup>9</sup>Department of Computing, Jonkoping University, Jonkoping, Sweden <sup>10</sup>Gertner Institute for Epidemiology and Healthcare Research, Gray Faculty of Medical & Health Sciences, Tel Aviv University, Tel Aviv, Israel <sup>11</sup>Department of Clinical Pharmacology, Sheba Medical Center, Ramat Gan, Israel <sup>12</sup>Department of Intensive Care, Maaynei Hayeshua, Bnei Brak, Israel

Received: 16 November 2025 / Accepted: 27 January 2026

## References

1. Moore FA, Moore EE. Metabolic response to injury. In: Townsend CM, Beauchamp RD, Evers BM, Mattox KL, editors. Sabiston textbook of surgery: the biological basis of modern surgical practice. 20th ed. Philadelphia: Elsevier; 2017. pp. 83–104.
2. Preiser JC, Ichai C, Orban JC, Groeneveld ABJ. Metabolic response to the stress of critical illness. Br J Anaesth. 2014;113(6):945–54. [doi:10.1093/bja/aeu187](https://doi.org/10.1093/bja/aeu187)
3. Compher C, Bingham AL, McCall M, Patel J, Rice TW, Braunschweig C, McKeever L. Guidelines for the provision of nutrition support therapy in the adult critically ill patient: the American society for parenteral and enteral nutrition. JPEN J Parenter Enter Nutr. 2022;46(1):12–41. [doi:10.1002/jpen.2267](https://doi.org/10.1002/jpen.2267)
4. Singer P, Blaser AR, Berger MM, et al. ESPEN practical guideline: clinical nutrition in the intensive care unit. Clin Nutr. 2023;42(4):410–43. [doi:10.1016/j.clnu.2023.02.027](https://doi.org/10.1016/j.clnu.2023.02.027)
5. Dickerson RN. Nitrogen balance and protein requirements for critically ill patients. Nutrients. 2016;8(4):211. [doi:10.3390/nu8040211](https://doi.org/10.3390/nu8040211)
6. Gunst J, Egi M, Van den Berghe G. Nutrition and metabolic control for ICU patients. Intensive Care Med. 2025;51:1150–2. [doi:10.1007/s00134-025-07937-7](https://doi.org/10.1007/s00134-025-07937-7)
7. Casaer MP, Mesotten D, Hermans G, Wouters PJ, Schetz M, Meyfroidt G, et al. Early versus late parenteral nutrition in critically ill adults. N Engl J Med. 2011;365(6):506–17. [doi:10.1056/NEJMoa1102662](https://doi.org/10.1056/NEJMoa1102662)
8. Marik PE, Bedigian MK. Refeeding hypophosphatemia in critically ill patients in an intensive care unit. A prospective study. Arch Surg. 1996;131(10):1043– 7. [doi:10.1001/archsurg.1996.01430220037007](https://doi.org/10.1001/archsurg.1996.01430220037007)
9. Arabi YM, Al-Dorzi HM, Mehta S, Tamim HM, Haddad SH, Jones G, et al. Association of protein intake with the outcomes of critically ill patients: a post hoc analysis of the PermiT trial. Am J Clin Nutr. 2018;108(5):988–96. [doi:10.1093/ajcn/nqy189](https://doi.org/10.1093/ajcn/nqy189)
10. Vanhorebeek I, den Van Berghe G. The epigenetic legacy of ICU feeding and its consequences. Curr Opin Crit Care. 2023;29(2):114–22. [doi:10.1097/MCC.0000000000001021](https://doi.org/10.1097/MCC.0000000000001021)
11. Vanhorebeek I, Casaer M, Gunst J. Nutrition and autophagy deficiency in critical illness. Curr Opin Crit Care. 2023;29(4):306–14. [doi:10.1097/MCC.0000000000001056](https://doi.org/10.1097/MCC.0000000000001056)
12. Van Dyck L, Casaer MP, Gunst J. Autophagy and its implications against early full nutrition support in critical illness. Nutr Clin Pract. 2018;33(3):339–47. http s://doi.org/10.1002/ncp.10084. [doi:10.1002/ncp.10084](https://doi.org/10.1002/ncp.10084)
13. Puthucheary ZA, Rawal J, McPhail M, Connolly B, Ratnayake G, Chan P, et al. Acute skeletal muscle wasting in critical illness. JAMA. 2013;310(15):1591– 600. [doi:10.1001/jama.2013.278481](https://doi.org/10.1001/jama.2013.278481)
14. Heyland DK, Patel J, Compher C, Rice TW, Bear DE, Lee ZY, et al. The effect of higher protein dosing in critically ill patients with high nutritional risk (EFFORT protein): an international, multicentre, pragmatic, registry-based randomised trial. Lancet. 2023;401(10376):568–76. [doi:10.1016/S0140-6736(22)02469-2](https://doi.org/10.1016/S0140-6736%2822%2902469-2)
15. Bels JLM, Thiessen S, van Gassel RJJ, Beishuizen A, De Bie Dekker A, Fraipont V, et al. Effect of high versus standard protein provision on functional recovery in people with critical illness (PRECISe): an investigator-initiated, double-blinded, multicentre, parallel-group, randomised controlled trial in Belgium and the Netherlands. Lancet. 2024;404(10453):659–69. [doi:10.1016/S0140-6736(24)01304-7](https://doi.org/10.1016/S0140-6736%2824%2901304-7)
16. TARGET Investigators, for the ANZICS Clinical Trials Group, Chapman M, Peake SL, Bellomo R, Davies A, Deane A, et al. Energy-dense versus routine enteral nutrition in the critically ill. N Engl J Med. 2018;379(19):1823–34. [doi:10.1056/NEJMoa1811687](https://doi.org/10.1056/NEJMoa1811687)
17. Fuentes Padilla P, Martínez G, Vernooij RW, Urrútia G, Roqué I Figuls M, Bonfill Cosp X. Early enteral nutrition (within 48 hours) versus delayed enteral nutrition (after 48 hours) with or without supplemental parenteral nutrition in critically ill adults. Cochrane Database Syst Rev. 2019;2019(10):CD012340. htt ps://doi.org/10.1002/14651858.CD012340. [doi:10.1002/14651858.CD012340](https://doi.org/10.1002/14651858.CD012340)
18. Pardo E, Lescot T, Preiser JC, Massanet P, Pons A, Jaber S, et al. Association between early nutrition support and 28-day mortality in critically ill patients: the FRANS prospective nutrition cohort study. Crit Care. 2023;27(1):7. [doi:10.1186/s13054-022-04298-1](https://doi.org/10.1186/s13054-022-04298-1)
19. Reignier J, Plantefeve G, Mira JP, Argaud L, Asfar P, Aissaoui N, et al. Low versus standard calorie and protein feeding in ventilated adults with shock: a randomised, controlled, multicentre, open-label, parallel-group trial (NUTRIREA-3). Lancet Respir Med. 2023;11(7):602–12. [doi:10.1016/S2213-2600(23)00092-9](https://doi.org/10.1016/S2213-2600%2823%2900092-9)
20. Ortiz-Reyes L, Patel JJ, Jiang X, Coz Yataco A, Day AG, Shah F, et al. Early versus delayed enteral nutrition in mechanically ventilated patients with circulatory shock: a nested cohort analysis of an international multicenter, pragmatic clinical trial. Crit Care. 2022;26(1):173. [doi:10.1186/s13054-022-04047-4](https://doi.org/10.1186/s13054-022-04047-4)
21. Summers MJ, Chapple LS, Karahalios A, Bellomo R, Chapman MJ, Ferrie S, et al. Augmented enteral protein during critical illness: the TARGET protein randomized clinical trial. JAMA. 2025;334(4):319–28. [doi:10.1001/jama.2025.9110](https://doi.org/10.1001/jama.2025.9110)
22. Heyland DK, Stephens KE, Day AG, McClave SA. The success of enteral nutrition and ICU-acquired infections: a multicenter observational study. Clin Nutr. 2011;30(2):148–55. [doi:10.1016/j.clnu.2010.09.011](https://doi.org/10.1016/j.clnu.2010.09.011)
23. McClave SA, Martindale RG, Kiraly L. The use of indirect calorimetry in the intensive care unit. Curr Opin Clin Nutr Metab Care. 2013;16(2):202–8. [doi:10.1097/MCO.0b013e32835dbc54](https://doi.org/10.1097/MCO.0b013e32835dbc54)
24. Heyland DK, Dhaliwal R, Jiang X, Day AG. Identifying critically ill patients who benefit the most from nutrition therapy: the development and initial validation of a novel risk assessment tool. Crit Care. 2011;15(6):R268. [doi:10.1186/cc10546](https://doi.org/10.1186/cc10546)
25. Wernerman J, Christopher KB, Annane D, et al. Metabolic support in the critically ill: a consensus of 19. Crit Care. 2019;23(1):318. [doi:10.1186/s13054-019-2597-0](https://doi.org/10.1186/s13054-019-2597-0)
26. Christopher KB. Nutritional metabolomics in critical illness. Curr Opin Clin Nutr Metab Care. 2018;21(2):121–5. [doi:10.1097/MCO.0000000000000451](https://doi.org/10.1097/MCO.0000000000000451)
27. Arabi YM, Aldawood AS, Haddad SH, et al. Permissive underfeeding or standard enteral feeding in critically ill adults. N Engl J Med. 2015;372(25):2398– 408. [doi:10.1056/NEJMoa1502826](https://doi.org/10.1056/NEJMoa1502826)
28. Singer P, Blaser AR, Berger MM, et al. ESPEN guideline on clinical nutrition in the intensive care unit. Clin Nutr. 2019;38(1):48–79. [doi:10.1016/j.clnu.2018.08.037](https://doi.org/10.1016/j.clnu.2018.08.037)
29. Doig GS, Simpson F, Finfer S, et al. Effect of evidence-based feeding guidelines on mortality of critically ill adults: a cluster randomized controlled trial. JAMA. 2008;300(23):2731–41. [doi:10.1001/jama.2008.826](https://doi.org/10.1001/jama.2008.826)
30. Weber-Carstens S, Schneider J, Wollersheim T, Assmann A, Bierbrauer J, Marg A, et al. Critical illness myopathy and GLUT4: significance of insulin and muscle contraction. Am J Respir Crit Care Med. 2013;187(4):387–96. [doi:10.1164/rccm.201209-1649OC](https://doi.org/10.1164/rccm.201209-1649OC)
31. Lu GP, Cui P, Cheng Y, Lu ZJ, Zhang LE, Kissoon N. Insulin control of blood glucose and GLUT4 expression in the skeletal muscle of septic rats. West Indian Med J. 2015;64(2):62–70. [doi:10.7727/wimj.2013.181](https://doi.org/10.7727/wimj.2013.181)
32. Heyland DK, Dhaliwal R, Wang M, Day AG. The prevalence of iatrogenic underfeeding in the nutritionally at-risk critically ill patient: results of an international, multicenter, prospective study. Clin Nutr. 2015;34(4):659–66. htt ps://doi.org/10.1016/j.clnu.2014.07.008. [doi:10.1016/j.clnu.2014.07.008](https://doi.org/10.1016/j.clnu.2014.07.008)
33. Casaer MP, den Van Berghe G. Nutrition in the acute phase of critical illness. N Engl J Med. 2014;370(13):1227–36. [doi:10.1056/NEJMra1304623](https://doi.org/10.1056/NEJMra1304623)
34. de Aguilar-Nascimento JE, Bicudo-Salomão A, Portari-Filho PE. Optimal timing for the initiation of enteral and parenteral nutrition in critical medical and surgical conditions. Nutrition. 2012;28(9):840–3. [doi:10.1016/j.nut.2012.01.013](https://doi.org/10.1016/j.nut.2012.01.013)
35. de Man AME, Gunst J, Reintam Blaser A. Nutrition in the intensive care unit: from the acute phase to beyond. Intensive Care Med. 2024;50(7):1035–48. htt ps://doi.org/10.1007/s00134-024-07458-9. [doi:10.1007/s00134-024-07458-9](https://doi.org/10.1007/s00134-024-07458-9)
36. Reintam Blaser A, Rooyackers O, Bear DE. How to avoid harm with feeding critically ill patients: a synthesis of viewpoints of a basic scientist, dietitian and intensivist. Crit Care. 2023;27(1):258. [doi:10.1186/s13054-023-04543-1](https://doi.org/10.1186/s13054-023-04543-1)
37. El Youssef J, Castle JR, Branigan DL, Bakhtiani PA, Schneider EH, Turksoy K, et al. A controlled study of the effectiveness of an adaptive closed-loop algorithm to minimize corticosteroid-induced stress hyperglycemia in type 1 diabetes. Diabetes Technol Ther. 2011;13(4):419–24. [doi:10.1089/dia.2010.0170](https://doi.org/10.1089/dia.2010.0170)
38. Pretty CG, Le Compte AJ, Chase JG, Shaw GM, Preiser JC, Penning S, et al. Impact of glucocorticoids on insulin resistance in the critically ill: a retrospective cohort study. Comput Methods Programs Biomed. 2011;104(2):e102–11. [doi:10.1016/j.cmpb.2010.12.013](https://doi.org/10.1016/j.cmpb.2010.12.013)
39. Kruszynska YT, Home PD, Hanning I, Alberti KGMM. Basal and 24-h C-peptide and insulin secretion rate in normal man. Diabetologia. 1987;30(1):16–21. htt ps://doi.org/10.1007/BF00295877. [doi:10.1007/BF00295877](https://doi.org/10.1007/BF00295877)
