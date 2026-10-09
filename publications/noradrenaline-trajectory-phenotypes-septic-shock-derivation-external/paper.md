## Introduction

Septic shock is a life-threatening manifestation of sepsis, characterized by profound hypotension and organ hypoperfusion, with mortality rates often exceeding 40% [1]. NA is widely recommended as the first-line vasopressor to restore adequate mean arterial pressure in septic shock [2], and its dosing requirements are often interpreted as a marker of shock severity [3–5]. Patients who require high-dose NA have particularly poor outcomes [6, 7].

However, clinical responses to NA vary widely: some patients rapidly stabilize and can be weaned off vasopressors within 24–48 h, whereas others require escalating or sustained support, or develop refractory vasoplegia despite increasing doses [8–10], and often progress to multiorgan failure. These divergent patterns underscore the biological and clinical heterogeneity of septic shock and motivate the use of phenotyping approaches grounded in dynamic vasopressor behavior rather than isolated measurements.

Prior observational studies have shown that prolonged or escalating NA exposure is strongly associated with increased mortality and organ failure [11, 12], and that an inability to taper vasopressors in the first several days is a powerful predictor of poor prognosis [12].

Unsupervised machine learning methods have proven to be powerful methods for uncovering phenotypes derived from temporal clinical data [8, 9]. Earlier approaches primarily clustered patients using static features, yielding phenotypes defined mainly by organ-failure patterns [13–17].

More recent approaches have incorporated time-series information to better capture the dynamic evolution of critical illness [18, 19]. For example, Shen et al. showed that the mortality impact of vasoactive drug dose and duration varies markedly across sepsis phenotypes [20], underscoring the clinical relevance of vasopressor time-course patterns. However, these studies continue to treat vasopressor use as an exposure rather than as a defining dynamic phenotype. This motivates the need to characterize vasopressor trajectories themselves as reproducible shock phenotypes.

More recent work has focused on vasopressor-dose trajectories. For example, Yang et al. (2025) applied group-based trajectory modeling to NA dosing over the first 4 days of septic shock and identified three distinct dose-trajectory phenotypes: low, intermediate, and high [12]. The high-dose group had worse baseline severity and mortality.

These studies show that clustering in the time domain, not just the static domain, can reveal meaningful septic-shock phenotypes with potential relevance for dynamic risk stratification and later supportive decision-making.

Classifying septic-shock patients according to their NA dose trajectories may improve dynamic risk stratification after the initial resuscitation phase, may help characterize persistence versus resolution of hemodynamic support needs, and may reduce physiologic heterogeneity in observational studies and interventional trials. However, it remains unknown whether long-horizon NA-trajectory phenotypes are reproducible across healthcare systems and whether phenotype-related trajectory signal can already be identified within the first 24 h of shock management, with more robust discrimination by 48 h.

To address these gaps, we pursued two objectives: (1) derive robust NA-trajectory phenotypes in a large single-center cohort using a transparent and reproducible clustering pipeline, and (2) perform external validation of the identical, fully prespecified pipeline in the MIMIC-IV database, representing a different continent, healthcare system and ICU practice environment.

## Methods

### Study design and cohort

The derivation cohort comprised 1111 adult ICU admissions with septic shock at Sheba Medical Center (Israel) between 2012 and mid-2025, defined by a clinical septic shock diagnosis with lactate > 2 mmol/L prior to or at ICU admission and active NA infusion. NA infusion trajectories were reconstructed and standardized to norepinephrine base-equivalent µg/kg/min using first-day recorded weight. In the Sheba cohort, norepinephrine was administered as Levophed or equivalent formulations, which are supplied as bitartrate salts but labeled in base-equivalent terms; thus, doses were analyzed on a harmonized base-equivalent scale [21].

The external validation cohort was drawn from MIMIC-IV v2.2 (2008–2019) at Beth Israel Deaconess Medical Center (Boston, USA) [22]. Septic shock was identified using the published Sepsis-3 computable phenotype (mimiciv\_derived.septic\_shock); to enable trajectory construction, we additionally required documented NA infusion records. For cross-cohort comparability, MIMIC-IV norepinephrine doses were likewise interpreted on a base-equivalent µg/kg/min scale. The final validation cohort included 9343 ICU stays (Supplement Fig. S1).

### Exposure construction

Medication administration records were converted into hourly NA infusion time-series over a 10-day horizon.

### Feature engineering

From each hourly NA series, we derived features capturing exposure magnitude and persistence (AUC-based measures), escalation timing and intensity, time-above clinically relevant dose thresholds, de-escalation kinetics, and post-peak rebound behavior. Full feature definitions and rationale regarding high-dose cutoffs are provided in the Supplement.

### Clustering workflow

We applied a prespecified two-stage clustering framework combining feature-based K-means with DTW-based refinement of NA time-series trajectories. In this framework, the primary coarse cluster structure was learned in the engineered feature space, whereas DTW refinement was used to improve alignment with similarity in the underlying temporal trajectories. We did not apply unsupervised feature reduction or formal de-correlation before clustering. This was intentional: the feature library included partially overlapping cumulative AUC and time-over-threshold variables, but also non-AUC trajectory descriptors such as time to maximal dose, post-peak rebound count, slopes, slope-angle changes, and recovery metrics. These variables were retained because they encode complementary and clinically interpretable aspects of exposure magnitude, timing, persistence, escalation, and resolution. Accordingly, the resulting phenotypes should be interpreted as clusters derived within a prespecified norepinephrine exposure–response feature representation, rather than as representation-neutral biological endotypes. Clusters with fewer than 30 patients were absorbed into the most similar larger cluster based on DTW medoid similarity. This minimum-size rule was chosen to favor stability and reproducibility of the final phenotype set, although it may reduce sensitivity for rare but potentially meaningful micro-phenotypes. For interpretability purposes only, phenotypes were renumbered by prognosis and assigned descriptive labels based on their NA dose–time patterns; this step did not influence clustering, feature selection, or external validation.

### Outcomes

The primary outcome was 90-day all-cause mortality. Because longer term mortality may be influenced by baseline comorbidity and post-acute events, 30-day all-cause mortality was also examined as a supportive secondary outcome. Survival was evaluated using landmarked Kaplan–Meier analyses, ΔRMST, and Cox proportional hazards models, with the lowest mortality phenotype as the reference. Sensitivity analyses are detailed in the Supplement.

### Feature importance and outcome association (interpretability)

To identify which trajectory features distinguished phenotypes and contributed to prognosis, we performed an individual-feature interpretability analysis assessing both feature discrimination across clusters and univariable associations with 90-day mortality (HR per 1 SD). Methodological details are provided in the Supplement.

### Landmarked multivariable modeling across time points

We fitted separate Cox models for 90-day mortality at prespecified landmarks (24–144 h) after ICU admission, including age, sex, SOFA, APACHE II, and the top trajectory features. At each landmark, the risk set included only patients alive and still under observation at that time; accordingly, estimates should be interpreted as prognosis conditional on survival to the relevant landmark rather than prognosis from ICU admission. Because the cardiovascular component of the conventional SOFA score incorporates vasopressor use, we additionally performed sensitivity Cox analyses at the 96-h landmark replacing SOFA with a modified SOFA score excluding the cardiovascular component. These 96-h sensitivity analyses were performed in both the Sheba and MIMIC- IV cohorts for both 30-day and 90-day mortality, using a base model that included cluster, age, sex, APACHE II, and the modified non-cardiovascular SOFA score, and an extended model that further adjusted for use of non-norepinephrine vasopressors, inotropic support, and renal replacement therapy by the landmark. Continuous covariates were standardized, with light penalization applied to improve stability. Hazard ratios with 95% CIs were reported for all landmarks (methodological details are provided in the Supplement).

### Internal validation

Internal validation was performed using an event-stratified train/test split, with discrimination assessed by Harrell’s C-index. Additional details are provided in the Supplement.

### External validation

The entire feature-engineering and clustering pipeline was frozen after derivation and applied without modification to the MIMIC-IV dataset.

We evaluated whether NA-trajectory phenotypes could be identified early by training horizon-limited multinomial logistic regression models using data available within the first 24–96 h after ICU admission. For each horizon, models used the top eight Sheba-ranked exposure features computable within that window. Continuous variables were standardized using the Sheba training data.

Because the derivation cohort yielded five phenotypes whereas MIMIC-IV produced six, external labels were harmonized prior to validation by merging two low-dose, early-resolving MIMIC-IV phenotypes into a single minimal/low early resolver class; remaining phenotypes were mapped based on DTW-refined trajectory similarity.

Models were trained exclusively in Sheba using class-balanced multinomial logistic regression with L2 regularization and temperature scaling. Performance was evaluated internally on an independent Sheba test set and externally in the harmonized MIMIC-IV cohort without retraining, using accuracy, macro-F1, Brier score, and correctness of high-confidence predictions (P\_max ≥ 0.80).

## Results

### Cohort and cluster structure

A total of 1111 admissions were included in the Sheba derivation cohort and 9343 admissions in the MIMIC-IV validation cohort. Patient demographics, illness severity, mortality, organ-support variables, selected early laboratory markers, major comorbidities, and infection source are summarized for selected matched phenotype pairs in Table 1, with full native-cluster characterization of all five Sheba phenotypes and all six MIMIC-IV phenotypes provided in Supplementary Table S1.

Values are shown for selected matched phenotype pairs to provide concise clinical context. The full native-cluster table, including all five Sheba phenotypes and all six MIMIC-IV phenotypes separately, is provided in Supplementary Table S1. Mortality values refer to patients alive at the 96-h landmark. Continuous variables are shown as mean ± SD or median [IQR], as appropriate. Lactate is reported in mmol/L.

After clustering and DTW-based refinement, one small cluster (*n* = 24) representing an extreme early high-dose “Fulminant Shock” pattern did not meet the prespecified minimum size and was absorbed into the most similar phenotype.

The final phenotype composition was low dose–early resolver (54.9%), high dose–early resolver (14.2%), intermediate dose–gradual wean (15.3%), high dose–slow resolver (5.7%), and intermediate dose–non-resolver (10.0%).

### Trajectory phenotypes (qualitative)

Median NA trajectories (IQR ribbons) presented distinct temporal exposure patterns across clusters (Fig. 1).

In general, lower risk clusters (low dose–early resolver for Sheba, minimal dose–early resolver and low dose– early resolver for MIMIC-IV) exhibited quicker early de-escalation, lower AUCs on days 2–4, and earlier t50. Higher risk clusters (high dose–slow resolver and intermediate dose–non-resolver) maintained higher exposures into days 2–4, with longer t50 and more time above 0.10 µg/kg/min.

### Survival analyses

At prespecified landmarks (e.g., 96 h), Kaplan–Meier analyses demonstrated clear and consistent separation in 90-day survival across trajectory phenotypes, with lowest mortality in the minimal/low–early resolver and highest mortality in the intermediate–non-resolver phenotype (Fig. 2). Corresponding Cox models showed progressively higher hazard ratios for higher risk phenotypes.

Similar mortality gradients were also observed at 30 days in both cohorts, supporting that the prognostic signal of the trajectory phenotypes was already evident in the earlier post-shock period (Supplementary Table S1 and Figure S5).

### Individual‑feature analysis (phenotype interpretability)

Across both cohorts, phenotype separation and mortality associations were dominated by exposure magnitude and persistence, particularly cumulative NA exposure and mid-course (24–72 h) dosing, as well as time-above physiologic thresholds (Fig. 3). Univariable analyses showed monotonic increases in mortality risk across prognosis-ordered phenotypes, with time to maximal NA dose emerging as a strong and consistent predictor independent of cumulative exposure. Withdrawal-speed metrics contributed comparatively little additional prognostic information.

### Consistency of covariate effects across landmarks

Multivariable landmark Cox models (24–144 h) showed broadly consistent covariate–mortality associations across time points and across health systems (Fig. 4). Age and SOFA-24 h were consistently associated with higher 90-day mortality in both cohorts. At the 96-h landmark, sensitivity analyses replacing SOFA with SOFA without the cardiovascular component yielded concordant associations for both 30-day and 90-day mortality in Sheba and MIMIC-IV, in both base and extended models.

Several norepinephrine-trajectory features also demonstrated reproducible independent associations, particularly delayed escalation (time to maximal dose, *t\_to\_max\_d*), rebound frequency (*rebound\_cnt*), and persistence above clinically relevant dose thresholds (*time\_ over\_0.10* and *time\_over\_0.45*). When exposure was decomposed into non-overlapping time-window AUC components, later-phase burden (days 3–4; AUC 48–72 h and 72–96 h) exhibited the most consistent adverse associations at the corresponding landmarks, whereas earlier window AUCs (day 1–2) showed weaker and less stable effects. Overall, the trajectory features that distinguish the phenotypes were also those most consistently associated with outcome, with similar directionality and magnitude in the external MIMIC-IV cohort.

<figure class="table-figure" id="table-1">
<figcaption><strong>Table 1</strong> Condensed clinical characteristics of selected matched norepinephrine-trajectory phenotypes in Sheba and MIMIC-IV</figcaption>
<div class="table-scroll"><table><tr><th>Variable</th><th>Sheba low, early<br/>resolver (n = 610)</th><th>MIMIC low, early<br/>resolver (n = 2205)</th><th>Sheba<br/>intermediate,<br/>gradual wean<br/>(n = 167)</th><th>MIMIC<br/>intermediate,<br/>gradual wean<br/>(n = 177)</th><th>Sheba<br/>intermediate,<br/>non-resolver<br/>(n = 112)</th><th>MIMIC<br/>intermediate, non-<br/>resolver (n = 114)</th></tr><tr><td>Demographics, severity</td><td>and mortality</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Age, years</td><td>63.0 ± 15.3</td><td>67.3 ± 15.1</td><td>61.1 ± 14.6</td><td>62.6 ± 13.8</td><td>62.5 ± 13.6</td><td>63.7 ± 15.0</td></tr><tr><td>Male sex</td><td>344 (56.4%)</td><td>1287 (58.4%)</td><td>100 (59.9%)</td><td>106 (59.9%)</td><td>72 (64.3%)</td><td>69 (60.5%)</td></tr><tr><td>APACHE II</td><td>29.3 ± 8.8</td><td>29.9 ± 8.2</td><td>31.5 ± 7.1</td><td>34.6 ± 7.4</td><td>30.1 ± 6.5</td><td>29.1 ± 9.0</td></tr><tr><td>SOFA (24 h max)</td><td>12.5 ± 3.9</td><td>11.1 ± 3.5</td><td>14.9 ± 3.6</td><td>13.0 ± 2.9</td><td>14.1 ± 3.6</td><td>11.7 ± 3.8</td></tr><tr><td>SOFA with-<br/>out cardiovascu-<br/>lar component</td><td>9.7 ± 3.5</td><td>8.2 ± 3.4</td><td>11.3 ± 3.5</td><td>10.1 ± 2.8</td><td>10.8 ± 3.2</td><td>9.4 ± 3.5</td></tr><tr><td>90-day mortality<br/>(96-h landmark)</td><td>37.0%</td><td>18.7%</td><td>53.5%</td><td>55.1%</td><td>89.3%</td><td>69.3%</td></tr><tr><td>30-day mortality<br/>(96-h landmark)</td><td>23.1%</td><td>17.1%</td><td>39.6%</td><td>50.4%</td><td>74.1%</td><td>66.7%</td></tr><tr><td>Mechanical<br/>ventilation<br/>(admission)</td><td>495 (81.1%)</td><td>1731 (78.5%)</td><td>146 (87.4%)</td><td>156 (88.1%)</td><td>107 (95.5%)</td><td>88 (77.2%)</td></tr><tr><td>Acute kidney<br/>injury (admis-<br/>sion)</td><td>298 (48.9%)</td><td>1403 (63.6%)</td><td>93 (55.7%)</td><td>150 (84.7%)</td><td>54 (48.2%)</td><td>83 (72.8%)</td></tr><tr><td>RRT any ICU</td><td>164 (27.4%)</td><td>405 (18.4%)</td><td>99 (59.3%)</td><td>101 (57.1%)</td><td>67 (59.8%)</td><td>73 (64.0%)</td></tr><tr><td>Cardiogenic<br/>shock</td><td>17 (2.8%)</td><td>305 (13.8%)</td><td>9 (5.4%)</td><td>41 (23.2%)</td><td>9 (8.0%)</td><td>30 (26.3%)</td></tr><tr><td>Any non-NE<br/>vasopressor any<br/>ICU</td><td>434 (72.5%)</td><td>1234 (56.0%)</td><td>163 (97.6%)</td><td>171 (96.6%)</td><td>110 (98.2%)</td><td>96 (84.2%)</td></tr><tr><td>Any inotrope<br/>any ICU</td><td>140 (23.4%)</td><td>495 (22.4%)</td><td>77 (46.1%)</td><td>99 (55.9%)</td><td>49 (43.8%)</td><td>49 (43.0%)</td></tr><tr><td>Peak lactate first<br/>24 h, mmol/L</td><td>3.0 [2.0, 5.16]</td><td>3.4 [2.2, 6.4]</td><td>4.6 [2.7, 9.5]</td><td>5.5 [3.1, 8.3]</td><td>2.7 [2.0, 4.0]</td><td>3.0 [1.9, 6.2]</td></tr><tr><td>Platelets,<br/>minimum first<br/>24 h, × 10⁹/L</td><td>153.0 [72.0, 238.5]</td><td>157.0 [97.0, 232.0]</td><td>120.5 [39.8, 203.2]</td><td>123.0 [62.0, 204.0]</td><td>147.5 [68.2, 245.0]</td><td>161.0 [76.2, 217.8]</td></tr><tr><td>D-dimer, first,<br/>ng/mL</td><td>3535.0 [1569.0,<br/>7745.0]</td><td>3130.0 [1453.0,<br/>8037.0]</td><td>3539.0 [2045.5,<br/>7599.5]</td><td>3812.0 [2081.5,<br/>8072.5]</td><td>3340.5 [1752.2,<br/>6614.0]</td><td>3934.0 [1623.0,<br/>5673.0]</td></tr><tr><td>CRP, first, mg/L<br/>Sepsis source</td><td>226.4 [155.5, 316.7]</td><td>129.4 [67.4, 216.2]</td><td>208.3 [130.6, 282.8]</td><td>135.0 [94.6, 145.9]</td><td>222.9 [156.9, 299.0]</td><td>203.1 [77.2, 241.2]</td></tr><tr><td>Abdominal</td><td>124 (20.3%)</td><td>186 (8.4%)</td><td>32 (19.2%)</td><td>21 (11.9%)</td><td>12 (10.7%)</td><td>6 (5.3%)</td></tr><tr><td>Pneumonia/res-<br/>piratory</td><td>197 (32.3%)</td><td>640 (29.0%)</td><td>53 (31.7%)</td><td>64 (36.2%)</td><td>47 (42.0%)</td><td>51 (44.7%)</td></tr><tr><td>Urinary tract<br/>Comorbidities</td><td>69 (11.3%)</td><td>449 (20.4%)</td><td>13 (7.8%)</td><td>39 (22.0%)</td><td>6 (5.4%)</td><td>14 (12.3%)</td></tr><tr><td>Chronic kidney<br/>disease</td><td>109 (17.9%)</td><td>633 (28.7%)</td><td>29 (17.4%)</td><td>54 (30.5%)</td><td>25 (22.3%)</td><td>43 (37.7%)</td></tr><tr><td>Diabetes mellitus</td><td>200 (32.8%)</td><td>735 (33.3%)</td><td>46 (27.5%)</td><td>56 (31.6%)</td><td>35 (31.2%)</td><td>37 (32.5%)</td></tr><tr><td>Hypertension</td><td>315 (51.6%)</td><td>1381 (62.6%)</td><td>75 (44.9%)</td><td>94 (53.1%)</td><td>51 (45.5%)</td><td>67 (58.8%)</td></tr><tr><td>Ischemic heart<br/>disease</td><td>122 (20.0%)</td><td>886 (40.2%)</td><td>37 (22.2%)</td><td>61 (34.5%)</td><td>23 (20.5%)</td><td>44 (38.6%)</td></tr></table></div>

</figure>

<figure id="fig-1">
<img src="figures/fig-1.webp" width="777" height="297" alt="Median NA trajectories by cluster" loading="lazy" decoding="async">
<figcaption><strong>Fig. 1</strong> Median NA trajectories by cluster. Solid lines represent the cluster‐specific median dose (µg/kg/min) from ICU admission; shaded bands represent the interquartile range. <strong>a</strong> Sheba cohort trajectories, <strong>b</strong> MIMIC-IV cohort trajectories</figcaption>
</figure>

<figure id="fig-2">
<img src="figures/fig-2.webp" width="777" height="569" alt="Survival by NA‐trajectory cluster and ΔRMST versus lowest mortality cluster (landmark 96 h)" loading="lazy" decoding="async">
<figcaption><strong>Fig. 2</strong> Survival by NA‐trajectory cluster and ΔRMST versus lowest mortality cluster (landmark 96 h). <strong>a</strong> Kaplan–Meier survival to 90 days by cluster— Sheba cohort. <strong>b</strong> Kaplan–Meier survival to 90 days—MIMIC-IV cohort. <strong>c</strong> Difference in restricted mean survival time (ΔRMST) at 90 days relative to the first, lowest mortality cluster—Sheba cohort. <strong>d</strong> ΔRMST at 90 days—MIMIC-IV cohort</figcaption>
</figure>

<figure id="fig-3">
<img src="figures/fig-3.webp" width="777" height="268" alt="Top discriminating features and top mortality-associated features" loading="lazy" decoding="async">
<figcaption><strong>Fig. 3</strong> Top discriminating features and top mortality-associated features. <strong>a</strong> Top discriminating features of NA trajectories in Sheba and MIMIC-IV. Bar plot showing the eight highest ranking features for separating cluster phenotypes in each cohort, based on combined random forest importance and ANOVA F-statistics. Exposure-related variables, particularly cumulative AUC windows (0–2 to 0–10 days) and mid-course exposure (AUC 24–48 h and 48–72 h), consistently ranked highest in both datasets, indicating strong cross-cohort agreement on the dimensions that define trajectory phenotypes. <strong>b</strong> Top mortality-associated NA-trajectory features (96-h landmark, 90-day mortality). Forest plot showing hazard ratios per 1-SD increase for the eight most prognostic features shared by Sheba and MIMIC-IV, using linear HR scale. Cumulative exposure features (e.g., AUC 0–10 days, 0–5 days, 0–4 days, 0–3 days) and early mid-course exposure (AUC 48–72 h, 72–96 h) show the strongest mortality associations in both cohorts, with broadly consistent effect sizes. Vertical dashed line denotes HR = 1.0 (no association)</figcaption>
</figure>

### Internal validation

Prognostic performance of landmark Cox models incorporating trajectory phenotypes was assessed with and without adjustment for baseline severity. At the 96-h landmark, cluster-only models achieved a Harrell’s C-index of 0.65, increasing to 0.70–0.72 after covariate adjustment. Across landmarks (24–144 h), cluster-only C-indices ranged from 0.63 to 0.66, and adjusted models from 0.68 to 0.72 (Supplementary Fig. S4). Bootstrap optimism correction showed minimal attenuation (< 0.02).

(See figure on next page.)

### External validation

Generalizability was evaluated in the independent MIMIC-IV cohort using the frozen derivation pipeline and prespecified phenotype mapping. Mortality gradients were preserved across externally assigned phenotypes, reproducing the internal risk hierarchy (Fig. 2). In unrefitted external Cox models, cluster-only Harrell’s C-indices ranged from 0.61 to 0.63 across landmarks (0.61 at 96 h), with closely parallel development and validation performance (Supplementary Fig. S4).

### Early cluster prediction

### Derivation cohort (Sheba)

Although phenotypes were defined from full 10-day NA trajectories, a phenotype-related signal was already present at 24 h and became more discriminative by 48 h. Using 24-h features, the temperature-scaled multinomial model achieved 85% accuracy; 75% of patients met the high-confidence threshold (P\_max ≥ 0.80), with 94% **Fig. 4** Multivariate landmark Cox models (24–144 h). Forest plots of hazard ratios (HRs) and 95% confidence intervals from multivariable landmark Cox proportional hazards models estimated at prespecified landmarks (24, 48, 72, 96, 120, and 144 h after ICU admission) in **a** the Sheba derivation cohort and **b** the external MIMIC-IV validation cohort. Points denote HR estimates and horizontal bars denote 95% confidence intervals; colors indicate landmark time. Continuous predictors were standardized to 1 SD to enable comparison of effect magnitudes; *time\_over\_* variables are scaled per + 0.1 absolute increase. The vertical dashed line indicates HR = 1.0. Across both cohorts, age and SOFA-24 h were consistently associated with increased mortality risk, and norepinephrine-trajectory features reflecting delayed escalation (*t\_to\_max\_d*), rebound (*rebound\_ cnt*), and time above dose thresholds (*time\_over\_0.10*, *time\_over\_0.45*) showed reproducible adverse associations. Decomposition of exposure into non-overlapping AUC windows highlighted a stronger and more consistent association for later-phase burden (48–96 h) compared with earlier windows accuracy within this subgroup. By 48 h, overall accuracy increased to 89%, high-confidence coverage to 78%, and high-confidence subgroup accuracy to 95%. Performance remained stable at later horizons, with 72-h and 96-h models achieving 90% and 85% overall accuracy, respectively, and 96% accuracy within high-confidence subsets.

<figure id="fig-4">
<img src="figures/fig-4.webp" width="777" height="958" alt="(See legend on previous page.)" loading="lazy" decoding="async">
<figcaption><strong>Fig. 4</strong> (See legend on previous page.)</figcaption>
</figure>

### External validation cohort (MIMIC‑IV)

External performance closely paralleled derivation results. Using 24-h features, the model achieved 86% accuracy; 88% of patients met the high-confidence threshold, with 91% accuracy within this subgroup. By 48 h, overall accuracy increased to 88%, high-confidence coverage to 89%, and high-confidence subgroup accuracy to 93%. Performance remained stable to improved at later horizons, reaching 89% accuracy at 72 h and 90% at 96 h, with high-confidence subgroup accuracy of 93% and 95%, respectively. Misclassification patterns mirrored those observed in Sheba, with errors concentrated among intermediate phenotypes, whereas extreme phenotypes were rarely confused with one another. Temperature scaling yielded stable probability estimates across horizons. Detailed performance metrics and confusion matrices are provided in Supplementary Tables S5 and S6.

To complement the confusion matrices, Fig. 5 provides an alluvial visualization of 48-h predicted versus final phenotype assignment, illustrating classification stability and the main directional misclassification patterns.

## Discussion

In this study, we derived and externally validated NA dose-trajectory phenotypes in septic shock using a transparent clustering framework applied independently to two large ICU populations. Across both cohorts, the approach revealed distinct and clinically interpretable NA trajectories that corresponded closely with differences in 90-day mortality, reinforcing that dynamic vasopressor response captures meaningful heterogeneity in hemodynamic response during septic shock. We used 90-day mortality as the primary endpoint and also examined 30-day mortality. Similar risk gradients at 30 days indicate that the prognostic signal was already present early after shock.

### Phenotypic structure and hemodynamic‑response interpretation

The trajectory phenotypes reflected clinically recognizable hemodynamic-response patterns. Favorable groups showed rapid early de-escalation, low cumulative exposure during days 2–4, and earlier half-dose recovery (t50), patterns compatible with earlier hemodynamic stabilization and treatment responsiveness. Unfavorable groups required sustained high doses, exhibited rebound-prone behavior, or developed late dose escalation patterns likely reflecting more persistent vasoplegia, ongoing shock, or evolving multiorgan dysfunction [7, 11, 12].

<figure id="fig-5">
<img src="figures/fig-5.webp" width="777" height="398" alt="Flow from 48-h predicted phenotype to final trajectory phenotype assignment" loading="lazy" decoding="async">
<figcaption><strong>Fig. 5</strong> Flow from 48-h predicted phenotype to final trajectory phenotype assignment. Alluvial diagrams show the relationship between phenotype predicted from truncated 48-h norepinephrine exposure data and final phenotype assignment based on the full trajectory framework in the derivation cohort (<strong>a</strong>, Sheba full derivation cohort with out-of-fold predictions) and the external validation cohort (<strong>b</strong>, MIMIC-IV). Left-sided strata represent the phenotype predicted at 48 h; right-sided strata represent the final assigned phenotype. Ribbon widths are proportional to patient counts. Dominant straight flows indicate stable early classification, whereas crossing flows indicate directional misclassification, most prominently among intermediate phenotypes</figcaption>
</figure>

An important interpretive point is that these phenotypes were designed to describe the evolution of noradrenaline requirement itself. They therefore represent hemodynamic-response phenotypes rather than pure biological endotypes of septic shock. Importantly, NA dose is not a direct physiological measurement. It reflects a composite of vascular responsiveness, disease severity, volume status, cardiac function, institutional practice, and clinician titration against conventional hemodynamic targets. Accordingly, the dose required over time should not be viewed as an arbitrary treatment choice alone, but as a treatment-response trajectory with physiological correlates that also reflects bedside management. To provide clinical and biological context for these hemodynamic-response patterns, we also examined phenotype-level distributions of lactate, platelet count, CRP, D-dimer, and infection source. Notably, the high early resolver phenotype showed marked early metabolic and hematologic derangement yet lower mortality than the high slow resolver and non-resolver phenotypes, suggesting that persistence of noradrenaline requirement conveys information beyond initial insult severity alone. Consistent with a more coagulopathic phenotype, the high slow resolver cluster showed the highest early D-dimer values in both cohorts.

Two design choices enhanced interpretability and robustness: (1) outcome-agnostic clustering with outcome-based renumbering, which prevented outcome leakage while producing clinically intuitive labels, and (2) a rich feature set that captured both smooth and abrupt changes in vasopressor support, yielding a stable and high-resolution phenotypic structure.

### Stability and cross‑cohort reproducibility of the cluster structure

The core trajectory families were highly reproducible across the two health systems, with only two expected differences at the extremes of severity and duration.

- 1. Cluster number differed slightly.

Sheba ultimately produced five stable clusters after the very small “Fulminant Shock’’ group—marked by extreme early NA requirements and very high early mortality—was absorbed during DTW refinement.

This reflected a deliberate preference for a stable and reproducible phenotype structure over retention of very small extreme-tail groups as standalone clusters. While such rare micro-phenotypes may still be clinically informative, we considered them less suitable as primary phenotypes unless they met the prespecified minimum-size criterion. In contrast, MIMIC-IV retained six stable clusters.

- 2. Prolonged-exposure phenotypes differed in duration. Sustained and late-escalating phenotypes (e.g., “Intermediate-dose Gradual Wean’’ and “Intermediate-dose Non-resolver”) persisted longer in Sheba, even though their shapes were nearly identical to their counterparts in MIMIC-IV.

These discrepancies likely reflect institutional differences in aggressive support and end-of-life practices. Sheba commonly maintains full hemodynamic support for longer periods, generating both the brief, high-dose ‘Fulminant Shock’ trajectory and prolonged vasopressor courses in survivors. At the MIMIC-IV source hospital, earlier transition to comfort-focused care and a pharmacy/protocol norepinephrine ceiling of 0.5 µg/kg/min may have limited representation of very high dose exposures and shortened observable trajectories, thereby influencing the final cluster structure.

Despite these differences in duration, the shape, relative structure, and prognostic ordering of the phenotypes were strongly preserved across cohorts, supporting that trajectory-based phenotyping captures stable and transportable dimensions of vasopressor-response behavior in septic shock.

### Drivers of phenotypic separation and mortality

Individual-feature analyses showed that dose duration and persistence metrics were the primary determinants of both phenotype separation and mortality. Cumulative AUC windows, mid-course exposure (24–72 h), and time-over-threshold measures consistently ranked highest across cohorts [3–5]. This finding should be interpreted in light of the prespecified feature representation: the clustering library intentionally included overlapping cumulative AUC windows and time-over-threshold metrics to capture clinically interpretable dimensions of vasopressor burden and persistence. Therefore, the emergence of exposure-persistence phenotypes is partly a consequence of this predefined representation rather than a representation-neutral discovery.

However, the phenotypes were not determined by cumulative exposure alone. Time to maximal NA dose (t\_to\_max\_d) emerged as a strong, reproducible predictor in both Sheba and MIMIC-IV, indicating that the timing of the hemodynamic peak carries adverse prognostic information beyond total exposure burden [6]. This may reflect ongoing shock physiology, delayed hemodynamic stabilization, incomplete control of the underlying insult, or progression of multiorgan dysfunction.

Withdrawal-speed features, including early slopes, t50, and half-drop metrics, added comparatively little incremental prognostic value. This suggests that the dominant independent signal lies less in the fine structure of vasopressor tapering and more in the broader pattern of dose burden, escalation timing, persistence, and failure of resolution.

Multivariable landmark models (24–144 h) showed stable effect directions across time and across cohorts, with expected attenuation and occasional CI overlap due to collinearity and smaller samples at later horizons (Fig. 4).

These findings should be interpreted as both confirmatory and additive. The broad clinical observation that persistent or escalating vasopressor requirement is associated with worse outcome is already well recognized. The added value of the present framework is that it extends this intuition beyond dose or duration alone by integrating multiple trajectory descriptors, including cumulative exposure, threshold persistence, timing of maximal dose, rebound behavior, and recovery metrics. Thus, the framework does not merely restate that prolonged vasopressor dependence is harmful; it converts clinically recognizable vasopressor-response patterns into a transparent, externally tested structure for dynamic risk stratification, cohort enrichment, and future trajectory-informed studies.

Taken together, these results support interpretation of the clusters as clinically interpretable hemodynamic-response trajectories, while acknowledging that alternative representations, such as de-correlated feature sets, raw time-series clustering alone, or multimodal physiologic inputs, might yield different phenotype structures.

### Internal and external prognostic validation

In the derivation cohort, trajectory membership demonstrated strong prognostic separation at 96 h (optimism-corrected Harrell’s *C* = 0.636). The entire frozen pipeline applied to MIMIC-IV reproduced the trajectory families and demonstrated monotonic 90-day mortality gradients from lowest to highest risk clusters (16–69%), which is highly comparable to the prognostic range captured by complex biological subphenotypes [13, 14].

When cluster number was treated as an ordinal variable in a non-refitted Cox model, discrimination in MIMIC- IV remained meaningful (C-index 0.619; AUROC 0.63), consistent with expected attenuation when transporting dynamic physiologic models across systems.

Feature-outcome associations were directionally and rank-order consistent across cohorts, further supporting external validity and physiologic transportability.

### Early recognition of phenotypes

The ability to identify NA trajectory phenotypes from data available within the first 24 h, with stronger discrimination by 48 h, indicates that meaningful differences in hemodynamic trajectories emerge early in the course of illness. The reproducibility of this early signal across two health systems—despite differences in documentation density, patient mix, and clinical workflows—suggests that the trajectory structure reflects stable and transportable patterns embedded in routine dosing data rather than artifacts of local practice.

Early misclassification patterns were clinically coherent and consistent with the expected temporal evolution of the phenotypes. In the derivation cohort, the primary source of ambiguity involved the intermediate gradual wean and minimal/low early resolver groups, which share a low-dose pattern during the first 24–48 h before diverging thereafter. This early similarity accounts for the directional misclassification of those clusters and reflects the genuine difficulty of distinguishing these two trajectories before mid-course exposure accumulates. In contrast, the high slow resolver phenotype begins at substantially higher doses and remained well separated in the derivation data; its occasional reassignment to intermediate, gradual wean cluster in the external cohort likely reflects differences in early exposure distributions and the limited discriminatory power of the truncated early-feature set, rather than true overlap in the underlying trajectory pattern.

Although the classifier demonstrated strong generalizability, the external misclassification patterns underscore that site-level calibration may be necessary to optimize early prediction. Differences in dose ceilings, recording density, and the distribution of early exposures can shift the mapping between features and phenotypes, and modest recalibration may further improve discrimination, particularly for intermediate phenotypes.

Importantly, 24-h and 48-h classification should not be considered clinically equivalent: a phenotype-related signal was already present at 24 h, but classification was more stable and informative by 48 h.

Together, these findings show that the core differences encoded within NA trajectories arise early and are reproducible across health systems. However, the present study demonstrates early descriptive and prognostic classification rather than an established phenotype-specific treatment algorithm. The intended near-term use of early classification is therefore best viewed in three domains: dynamic risk stratification, enrichment of future observational or interventional studies, and generation of hypotheses regarding trajectory-specific supportive strategies.

A conceptual clinical interpretation is that a high-confidence assignment at 24 h may provide early risk awareness, whereas by 48 h, when phenotype discrimination was stronger and misclassification decreased, persistence of a slow-resolving or non-resolving pattern may identify a more prognostically enriched subgroup for closer reassessment or for inclusion in future trials testing monitoring or de-escalation strategies. Conversely, early-resolving patterns may help define lower risk comparator groups in research settings. At this stage, these interpretations should be viewed as hypothesis-generating; prospective studies are required to determine whether early phenotype assignment can meaningfully influence management or patient outcomes.

In future prospective work, this framework could be evaluated as a decision-support layer that continuously updates phenotype probabilities from routinely charted norepinephrine exposure during the first 24–48 h. Rather than dictating a fixed treatment algorithm, such a tool could flag patients whose early course appears more compatible with slow resolution or non-resolution, thereby prompting closer reassessment of hemodynamic trajectory, supportive intensity, and readiness for de-escalation. Because calibration differed across cohorts, any such implementation would require local recalibration before bedside deployment.

### Limitations

This study has several limitations. First, its retrospective design precludes causal inference, and NA dosing inevitably reflects both underlying illness severity and clinician decision-making (“confounding by indication”). Second, although trajectory phenotypes were reproducible across two large health systems, differences in treatment-limitation practices, including withholding or withdrawal of life-sustaining therapy, and differences in duration of supportive care may have influenced the expression of prolonged trajectories. Third, despite extensive feature engineering, unmeasured physiologic variables—such as microcirculatory flow, cardiac output, or autonomic tone—may contribute to phenotype structure but were not directly captured. Fourth, dose trajectories were reconstructed from routine medication administration records, and varying documentation density across systems may introduce subtle measurement error. Finally, while early classification performance generalized well, calibration differed between cohorts, indicating that site-specific recalibration procedures may be necessary to optimize early phenotype assignment in new clinical environments.

#### Funding

## Conclusions

Noradrenaline-trajectory phenotypes derived from routine medication data were clinically interpretable, prognostically coherent, and reproducible across two ICU populations. Despite minor cross-system differences, the core trajectory shapes and associated mortality gradients were conserved. Two exposure-persistence features—time to maximal NA dose and cumulative NA load during days 2–4—consistently dominated prognosis and drove phenotype separation. Because these defining elements were already detectable at 24 h and became more discriminative by 48 h, trajectory phenotypes may support dynamic risk stratification after initial resuscitation and phenotype-enriched clinical trial design. Their role in guiding monitoring, de-escalation, or supportive strategies remains hypothesis-generating and requires prospective evaluation.

## Supplementary Information

The online version contains supplementary material available at https://doi.org/10.1186/s40635-026-00910-8.

Additional file1 (DOCX 620 kb)

#### Acknowledgements

The authors acknowledge the MIT Laboratory for Computational Physiology for maintaining the MIMIC-IV database and PhysioNet for hosting the data [22]. The authors completed the required training and received approval to use the data.

#### Author contributions

YG conceived and designed the study, performed substantial analysis and interpretation of the data, and was a major contributor in drafting the manuscript and substantively revising it. AC, OL, DC, JK, HS, MG, YH, JV and DS were responsible for the acquisition of data and contributed to substantively revising the work. TL performed substantial analysis and interpretation of data and substantively revised the work. MS contributed to the interpretation of the data and substantively revised the work. ES contributed to the conception and design of the work, interpretation of the data, and was a major contributor in substantively revising the manuscript. All the authors read and approved the final manuscript.

Open access funding provided by Jönköping University. Data extraction and analysis validation was supported by the Sheba Hospital Research Fund.

#### Availability of data and materials

The datasets used and/or analyzed during the current study are available from the corresponding author upon reasonable request.

### Declarations

#### Ethics approval and consent to participate

The study was approved by the Institutional Helsinki Committee of Sheba Medical Center (SMC-D-2642-25). The requirement for informed consent was waived due to the retrospective design and use of anonymized data. All procedures were conducted in accordance with the ethical standards of the responsible committee and with the 1964 Declaration of Helsinki and its later amendments.

MIMIC-IV is a publicly available, fully de-identified critical care database approved for research use with a waiver of informed consent. All analyses were conducted under the required data use agreement and did not require additional IRB approval.

#### Consent for publication

The Sheba Hospital Research IRB provided a waiver for consent due to the retrospective and aggregative nature of the study.

#### Competing interests

All the authors declare that they have no conflicts of interest.

#### Author details

<sup>1</sup> Departments of Anesthesiology and Intensive Care, Sheba Medical Center, Ramat Gan, Israel. <sup>2</sup> Department of Intensive Care, Sheba Medical Center, Ramat Gan, Israel. <sup>3</sup> Departments of Nutrition and Intensive Care, Sheba Medical Center, Ramat Gan, Israel. <sup>4</sup> Intensive Care Unit, Sheba Medical Center, Ramat Gan, Israel. <sup>5</sup> Universidad Favaloro, Buenos Aires, Argentina. <sup>6</sup> Department of Information Systems, University of Haifa, Haifa, Israel. <sup>7</sup> Department of Computing, Jonkoping University, Jonkoping, Sweden. <sup>8</sup> Gertner Institute for Epidemiology and Healthcare Research, Gray Faculty of Medical and Health Sciences, Tel Aviv University, Tel Aviv‑Yafo, Israel. <sup>9</sup> Department of Intensive Care, Maaynei Hayeshua, Bnei Brak, Israel.

Received: 11 March 2026 Accepted: 6 May 2026

## References

1. Singer M, Deutschman CS, Seymour CW et al (2016) The third international consensus definitions for sepsis and septic shock (Sepsis-3). JAMA 315(8):801–810. [doi:10.1001/jama.2016.0287](https://doi.org/10.1001/jama.2016.0287)
2. Rhodes A, Evans LE, Alhazzani W, Levy MM, Antonelli M, Ferrer R, Kumar A, Sevransky JE, Sprung CL, Nunnally ME, Rochwerg B, Rubenfeld GD, Angus DC, Annane D, Beale RJ, Bellinghan GJ, Bernard GR, Chiche JD, Coopersmith C, De Backer DP, French CJ, Fujishima S, Gerlach H, Hidalgo JL, Hollenberg SM, Jones AE, Karnad DR, Kleinpell RM, Koh Y, Lisboa TC, Machado FR, Marini JJ, Marshall JC, Mazuski JE, McIntyre LA, McLean AS, Mehta S, Moreno RP, Myburgh J, Navalesi P, Nishida O, Osborn TM, Perner A, Plunkett CM, Ranieri M, Schorr CA, Seckel MA, Seymour CW, Shieh L, Shukri KA, Simpson SQ, Singer M, Thompson BT, Townsend SR, Van der Poll T, Vincent JL, Wiersinga WJ, Zimmerman JL, Dellinger RP (2017) Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock: 2016. Intensive Care Med 43(3):304–377. (Epub 2017 Jan 18. ) [doi:10.1007/s00134-017-4683-6](https://doi.org/10.1007/s00134-017-4683-6) · [PubMed 28101605](https://pubmed.ncbi.nlm.nih.gov/28101605/)
3. Reinikainen M, Delamarre L, Blaser AR, Hollenberg SM, Lobo SM, Rezende E, Moreno R, Rhodes A, Ranzani OT, Singer M, Lakbar I (2025) Association of noradrenaline dose with mortality in critically ill patients: a systematic review and dose-response meta-analysis. Crit Care 29(1):498. [doi:10.1186/s13054-025-05717-9](https://doi.org/10.1186/s13054-025-05717-9)
4. Ceausu D, Boulet N, Roger C, Alonso S, Lefrant JY, Boisson C, Mura T, Muller L (2024) Critical norepinephrine dose to predict early mortality during circulatory shock in intensive care: a retrospective study in 3423 ICU patients over 4-year period. Shock 62(5):682–687. [doi:10.1097/SHK.0000000000002454](https://doi.org/10.1097/SHK.0000000000002454)
5. Pölkki A, Pekkarinen PT, Hess B, Blaser AR, Bachmann KF, Lakbar I, Hollenberg SM, Lobo SM, Rezende E, Selander T, Reinikainen M (2024) Noradrenaline dose cutoffs to characterise the severity of cardiovascular failure: data-based development and external validation. Acta Anaesthe-siol Scand 68(10):1400–1408. [doi:10.1111/aas.14519](https://doi.org/10.1111/aas.14519)
6. Sacha GL, Lam SW, Wang L, Duggal A, Reddy AJ, Bauer SR (2022) Association of catecholamine dose, lactate, and shock duration at vasopressin initiation with mortality in patients with septic shock. Crit Care Med 50(4):614–623. [doi:10.1097/CCM.0000000000005317](https://doi.org/10.1097/CCM.0000000000005317)
7. Auchet T, Regnier M-A, Girerd N et al (2017) Outcome of patients with septic shock and high-dose vasopressor therapy. Ann Intensive Care 7:43. [doi:10.1186/s13613-017-0261-x](https://doi.org/10.1186/s13613-017-0261-x)
8. Teja B et al (2023) How we escalate vasopressor and corticosteroid therapy in sepsis. Chest 164(4):984–993. [doi:10.1016/j.chest.2022.11.018](https://doi.org/10.1016/j.chest.2022.11.018)
9. Russell JA et al (2008) Vasopressin versus NA infusion in patients with septic shock (VASST). N Engl J Med 358:877–887
10. Russell JA (2019) Vasopressor therapy in critically ill patients with shock. Intensive Care Med 45(11):1503–1517. [doi:10.1007/s00134-019-05801-z](https://doi.org/10.1007/s00134-019-05801-z)
11. Yang J, Liujiao Y, Zhang X, Xiong J, Wang F, Shen F (2025) High NE dose trajectory is associated with new onset of acute kidney injury patients: a group-based trajectory modeling analysis. PLoS ONE 20(5):e0323431. [doi:10.1371/journal.pone.0323431](https://doi.org/10.1371/journal.pone.0323431)
12. Chotalia M, Matthews T, Arunkumar S, Bangash MN, Parekh D, Patel JM (2021) A time-sensitive analysis of the prognostic utility of vasopressor dose in septic shock. Anaesthesia 76(10):1358–1366. [doi:10.1111/anae.15453](https://doi.org/10.1111/anae.15453)
13. Seymour CW et al (2019) Derivation, validation, and potential treatment implications of novel clinical phenotypes for sepsis. JAMA 321(20):2003– 2017. [doi:10.1001/jama.2019.5791](https://doi.org/10.1001/jama.2019.5791)
14. Aldewereld ZT, Zhang LA, Urbano A, Parker RS, Swigon D, Banerjee I, Gómez H, Clermont G (2022) Identification of clinical phenotypes in septic patients presenting with hypotension or elevated lactate. Front Med 9:794423. [doi:10.3389/fmed.2022.794423](https://doi.org/10.3389/fmed.2022.794423)
15. Liu G, Wu R, He J, Xu Y, Han L, Yu Y, Zhu H, Guo Y, Fu H, Chen T, Zheng S, Shen X (2025) Clinical phenotyping of septic shock with latent profile analysis: a retrospective multicenter study. J Crit Care 85:154932. [doi:10.1016/j.jcrc.2024.154932](https://doi.org/10.1016/j.jcrc.2024.154932)
16. Shald EA, Erdman MJ, Ferreira JA (2022) Impact of clinical sepsis phenotypes on mortality and fluid status in critically ill patients. Shock 57(1):57–62. [doi:10.1097/SHK.0000000000001864](https://doi.org/10.1097/SHK.0000000000001864)
17. Gårdlund B, Dmitrieva NO, Pieper CF, Finfer S, Marshall JC, Taylor Thompson B (2018) Six subphenotypes in septic shock: latent class analysis of the PROWESS Shock study. J Crit Care 47:70–79. [doi:10.1016/j.jcrc.2018.06.012](https://doi.org/10.1016/j.jcrc.2018.06.012)
18. Bhavani SV, Xiong L, Pius A, Semler M, Qian ET, Verhoef PA, Robichaux C, Coopersmith CM, Churpek MM (2023) Comparison of time series clustering methods for identifying novel subphenotypes of patients with infection. J Am Med Inform Assoc 30(6):1158–1166. [doi:10.1093/jamia/ocad063](https://doi.org/10.1093/jamia/ocad063)
19. Bhavani SV et al (2022) Development and validation of novel sepsis subphenotypes using trajectories of vital signs. Intensive Care Med 48(11):1582–1592. [doi:10.1007/s00134-022-06890-z](https://doi.org/10.1007/s00134-022-06890-z)
20. Shen J, Fang K, Xie J, Sun D, Li L (2025) Analysis of the heterogeneous treatment effect of vasoactive drug dosage and time on hospital mortality across different sepsis phenotypes: a retrospective cohort study. Eur J Med Res 30(1):410. [doi:10.1186/s40001-025-02660-x](https://doi.org/10.1186/s40001-025-02660-x)
21. Kotani Y, Belletti A, D’Andria Ursoleo J, Salvati S, Landoni G (2023) Norepinephrine dose should be reported as base equivalence in clinical research manuscripts. J Cardiothorac Vasc Anesth 37(9):1523–1524. [doi:10.1053/j.jvca.2023.05.013](https://doi.org/10.1053/j.jvca.2023.05.013)
22. Johnson AEW, Bulgarelli L, Shen L, Gayles A, Shammout A, Horng S, Pollard TJ, Hao S, Moody B, Gow B, Lehman LH, Celi LA, Mark RG (2023) MIMIC-IV, a freely accessible electronic health record dataset. Sci Data 10(1):1. 10.1038/s41597-022-01899-x. Erratum in: Sci Data. 2023 Jan 16;10(1):31. Erratum in: Sci Data. 2023 Apr 18;10(1):219. https://doi.org/10.1038/s41597-023-02136-9 [doi:10.1038/s41597-023-01945-2](https://doi.org/10.1038/s41597-023-01945-2)
