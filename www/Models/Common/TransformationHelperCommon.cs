using System;
using System.Linq;
using Anbr.Web.SA.CoreLogic.Model;
using Model.Utils;
using Omu.ValueInjecter;
using www.Models.Data.Out.Graph;

namespace www.Models.Common
{
    internal static class TransformationHelperCommon
    {
        public static ModelFileGallery[] ToLocalType(this FileDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static ModelFileGallery ToLocalType(this FileDTO mDTO)
        {
            return (ModelFileGallery)new ModelFileGallery().InjectFrom(mDTO);
        }

        public static ModelSession[] ToLocalType(this SessionDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static ModelSession ToLocalType(this SessionDTO mDTO)
        {
            return (ModelSession)new ModelSession().InjectFrom(mDTO);
        }

        public static SessionDTO[] ToDTOType(this ModelSession[] m)
        {
            return m.Select(param => param.ToDTOType()).ToArray();
        }

        public static SessionDTO ToDTOType(this ModelSession m)
        {
            return (SessionDTO)new SessionDTO().InjectFrom<NullablesInjection>(m);
        }


        public static AutoExecSchedulingTaskDTO[] ToDTOType(this AutoExecSchedulingTask[] m)
        {
            return m.Select(param => param.ToDTOType()).ToArray();
        }

        public static AutoExecSchedulingTaskDTO ToDTOType(this AutoExecSchedulingTask m)
        {
            var res = (AutoExecSchedulingTaskDTO)new AutoExecSchedulingTaskDTO().InjectFrom<NullablesInjection>(m);
            res.Periodicity = (AutoExecSchedulingTaskDTO.PeriodicityKind)m.Periodicity;
            res.SchedulingTaskType = (AutoExecSchedulingTaskDTO.TaskKind)m.SchedulingTaskType;
            res.State = (AutoExecSchedulingTaskDTO.StateKind)m.State;

            return res;
        }

        public static AutoExecSchedulingTask ToLocalType(this AutoExecSchedulingTaskDTO mDTO)
        {
            var res = (AutoExecSchedulingTask)new AutoExecSchedulingTask().InjectFrom<NullablesInjection>(mDTO);
            res.Periodicity = (AutoExecSchedulingTask.PeriodicityKind)mDTO.Periodicity;
            res.SchedulingTaskType = (AutoExecSchedulingTask.TaskKind)mDTO.SchedulingTaskType;
            res.State = (AutoExecSchedulingTask.StateKind)mDTO.State;

            return res;
        }

        public static AutoExecSchedulingTask[] ToLocalType(this AutoExecSchedulingTaskDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static AxisType ToAxisType(this Type type)
        {
            if (typeof(Int32) == type || typeof(Int64) == type || typeof(Double) == type || typeof(Decimal) == type) return AxisType.Double;
            if (typeof(DateTime) == type) return AxisType.DateTime;
            
            return AxisType.Category;
        }
    }
}
