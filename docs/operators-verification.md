# Operator address verification log

The bundled operator dataset in `src/content/operators/` ships with the
publicly listed accessibility / customer-relations contact details for
20 of the largest UK rail operators by passenger volume.

**Verification posture:** all entries were sourced on **2026-05-24** from
each operator's own published accessibility or "Help & contact" page.
Each JSON file's `lastVerifiedUTC` field carries that date so this
dataset can be audited annually.

> Data accuracy beyond initial seeding is the project owner's
> responsibility. Operator complaint addresses and assistance phone
> numbers change. Re-verify before any public release.

## Sources

| Operator                | Source page                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Avanti West Coast       | https://www.avantiwestcoast.co.uk/travelling-with-us/accessibility                                   |
| c2c                     | https://www.c2c-online.co.uk/help-and-support/accessibility/                                         |
| Chiltern Railways       | https://www.chilternrailways.co.uk/about-us/accessibility                                            |
| CrossCountry            | https://www.crosscountrytrains.co.uk/travel-information/accessibility                                |
| East Midlands Railway   | https://www.eastmidlandsrailway.co.uk/travel-information/accessibility                               |
| Elizabeth line (TfL)    | https://tfl.gov.uk/modes/elizabeth-line/accessibility                                                |
| Great Western Railway   | https://www.gwr.com/plan-journey/journey-information/accessibility                                   |
| Greater Anglia          | https://www.greateranglia.co.uk/travel-information/accessibility                                     |
| LNER                    | https://www.lner.co.uk/travel-information/travelling-with-us/accessibility/                          |
| Lumo                    | https://www.lumo.co.uk/help/accessibility                                                            |
| Merseyrail              | https://www.merseyrail.org/plan-my-journey/accessibility.aspx                                        |
| Northern                | https://www.northernrailway.co.uk/travel/accessibility                                               |
| ScotRail                | https://www.scotrail.co.uk/plan-your-journey/disabled-and-elderly-passengers                         |
| South Western Railway   | https://www.southwesternrailway.com/travelling-with-us/accessibility                                 |
| Southeastern            | https://www.southeasternrailway.co.uk/travel-information/accessibility                               |
| Southern (GTR)          | https://www.southernrailway.com/travel-information/accessibility                                     |
| Thameslink (GTR)        | https://www.thameslinkrailway.com/travel-information/accessibility                                   |
| TransPennine Express    | https://www.tpexpress.co.uk/travelling-with-us/accessibility                                         |
| Transport for Wales     | https://tfw.wales/help-and-contact/accessibility                                                     |
| West Midlands Railway   | https://www.westmidlandsrailway.co.uk/travel-information/accessibility                               |

## Re-verifying

For each operator's JSON file:

1. Open the source URL above.
2. Find the published "complaints" / "customer relations" email or web form.
3. Find the assistance booking phone number on the Passenger Assist page.
4. If anything has changed, update the JSON and bump `lastVerifiedUTC`.
5. If the operator has been re-franchised or merged, replace the file
   and update `src/content/operators/index.ts` + the table above.
