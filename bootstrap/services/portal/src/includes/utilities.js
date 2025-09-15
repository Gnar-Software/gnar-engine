
import { mainAreasOfMaths } from '../data/data';

/**
 * Calculate the total level from the levels
 * 
 * @param {array} levels 
 * @param {int} startsAt 
 */
export const calcTotalLevel = (levels, startsAt) => {

    if (!levels || levels.length == 0) {
        levels = [0,0,0,0,0,0];
    }
    
    let newTotalLevel = levels.reduce((acc, level, i) => {
        if (startsAt > 0 && i + 1 < startsAt) {
            return acc;
        }
        if (level == '' || level == null) {
            return acc;
        }
        return parseFloat(acc) + parseFloat(level);
    }, 0);

    if (newTotalLevel > 0 && startsAt) {
        newTotalLevel = newTotalLevel + (startsAt - 1);
    }

    return newTotalLevel;
}


/**
 * Calculate assessment areas with intervention
 * 
 * @param {object} currentPeriod
 * @param {object} previousPeriod
 * @return {array} assessmentAreas
 */
export const calcAreasWithIntervention = (currentPeriod, previousPeriod) => {

    const areas = [];

    return areas;
}


/**
 * Calculate the period prior to the current period
 * 
 * @param {array} periods
 * @param {object} currentPeriod
 */
export const calcPreviousPeriod = (periods, currentPeriod) => {
    
    let previousPeriod = null;

    periods.forEach((period, i) => {
        if (period.period_id == currentPeriod.period_id) {
            previousPeriod = periods[i - 1];
        }
    });

    return previousPeriod;
}


/**
 * Calculate bundles with intervention
 * 
 * @param {object} currentBundleProgress
 * @param {object} previousBundleProgress
 * @return {array} bundles
 */
export const calcBundlesWithIntervention = (currentBundleProgress, previousBundleProgress) => {

    const bundles = [];

    Object.keys(currentBundleProgress).forEach((levelKey, i) => {
        Object.keys(currentBundleProgress[levelKey]).forEach((bundleKey, j) => {

            let currentPeriodBundle = currentBundleProgress[levelKey][bundleKey];
            let previousPeriodBundle = previousBundleProgress[levelKey][bundleKey];

            if (currentPeriodBundle.completed == 'complete' && previousPeriodBundle.completed !== 'complete') {
                const levelLabel = levelKey.replace('level-', 'Level ');
                currentPeriodBundle.levelLabel = levelLabel;
                bundles.push(currentPeriodBundle);
            }
        });
    });

    return bundles;
}


/**
 * Calculate assessment average score
 * 
 * @param {object} assessment
 * @return {float} averageScore
 */
export const calcAssessmentAverageScore = (assessment, selectedSubject = 'maths_all_areas') => {

    if (!assessment) {
        return 0;
    }

    // parse if it's a string
    if (typeof assessment === 'string') {
        assessment = JSON.parse(assessment);
    }

    let totalScore = 0;
    let totalAreas = 0;

    Object.keys(assessment).forEach((areaKey) => {
        assessment[areaKey].topics.forEach((topic) => {

            // skip some areas if it's maths main areas
            if (selectedSubject == 'maths_main_areas') {
                console.log('maths main areas', areaKey);
                if (!mainAreasOfMaths.includes(areaKey)) {
                    return;
                }
            }

            const thisScore = parseFloat(calcTotalLevel(topic.level, topic['starts-at']));

            if (thisScore) {
                totalAreas++;
                totalScore = totalScore + thisScore;
            }
        });
    });

    let average = totalScore / totalAreas;

    // round to 1 decimal place
    average = Math.round(average * 10) / 10;

    return average;
}

/**
 * Calculate assessment average score
 * 
 * @param {object} assessment
 * @return {float} averageScore
 */
export const calcNumbersAreaAverageScore = (assessment) => {

    const numberAreaKeys = mainAreasOfMaths;

    if (!assessment) {
        return 0;
    }

    // parse if it's a string
    if (typeof assessment === 'string') {
        assessment = JSON.parse(assessment);
    }

    let totalScore = 0;
    let totalAreas = 0;

    Object.keys(assessment).forEach((areaKey) => {
        if (!numberAreaKeys.includes(areaKey)) {
            return;
        }

        assessment[areaKey].topics.forEach((topic) => {
            const thisScore = parseFloat(calcTotalLevel(topic.level, topic['starts-at']));

            if (thisScore) {
                totalAreas++;
                totalScore = totalScore + thisScore;
            }
        });
    });

    let average = totalScore / totalAreas;

    // round to 1 decimal place
    average = Math.round(average * 10) / 10;

    return average;
}

/**
 * Calculate completeness of academic year intervention for a student
 * 
 * @param {array} periods
 * @param {array} selectedPeriods
 * @return {string} completeness (complete, partial, none)
 */
export const calcAcademicYearInterventionCompleteness = (periods, selectedPeriods) => {

    let completeness;
    let someWithIntervention = false;
    let someWithoutIntervention = false;

    // get the academic years in selected periods
    // let selectedAcademicYears = [];

    // selectedPeriods.forEach(selectedPeriod => {
    //     if (!selectedAcademicYears.includes(selectedPeriod.academic_year)) {
    //         selectedAcademicYears.push(selectedPeriod.academic_year);
    //     }
    // });

    selectedPeriods.forEach((selectedPeriod) => {
        periods.forEach(period => {
            if (period.period_name == selectedPeriod.period_name && period.calendar_year == selectedPeriod.calendar_year) {
                if (period.has_had_intervention == 1) {
                    someWithIntervention = true;
                } else {
                    someWithoutIntervention = true;
                }
            }
        });
    });

    if (someWithIntervention && someWithoutIntervention) {
        completeness = 'partial';
    } else if (someWithIntervention && !someWithoutIntervention) {
        completeness = 'complete';
    } else {
        completeness = 'none';
    }

    return completeness;
}


/**
 * Calculate if had some low attendance in selected periods
 * 
 * @param {array} periods
 * @param {array} selectedPeriods
 * @return {boolean} hadLowAttendance
 */
export const calcHadSomeLowAttendance = (periods, selectedPeriods) => {

    let hadSomeLowAttendance = false;

    periods.forEach((period) => {
        selectedPeriods.forEach((selectedPeriod) => {
            if (period.period_name == selectedPeriod.period_name && period.academic_year == selectedPeriod.academic_year) {
                if (period.attendance == 'low') {
                    hadSomeLowAttendance = true;
                }
            }
        });
    })

    return hadSomeLowAttendance;
}